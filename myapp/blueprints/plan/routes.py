from flask import render_template, request, redirect, url_for, Blueprint, jsonify, current_app, make_response
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.plan.models import Transaction
from myapp.app import db

import json
from openai import OpenAI
import pandas as pd
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import time

plan = Blueprint('plan', __name__, template_folder='templates', static_folder='static')

@plan.route('/')
@login_required
def index():
    # Get all Transactions belonging to current user
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()
    transactions_dict = [transaction.to_dict() for transaction in transactions]

    return render_template('plan/overview.html', transactions=transactions_dict)


@plan.route("/upload_csv", methods=["POST"])
@login_required
def upload_csv():
    """
    Endpoint to upload a CSV file and store transactions in the database.
    """
    ALLOWED_EXTENSIONS = {'csv'}

    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format"}), 400

    # Get the upload folder from app config
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # Read CSV file
    df = pd.read_csv(filepath)

    # Remove leading and trailing whitespaces from column names
    df.columns = df.columns.str.strip()

    # Ensure required columns exist
    required_columns = {'Transaction Date', 'Value Date', 'Statement Code', 'Reference', 'Debit Amount', 'Credit Amount', 'Client Reference', 'Additional Reference', 'Misc Reference'}
    
    if not required_columns.issubset(df.columns):
        print(df.columns)
        return jsonify({"error": "Invalid CSV format"}), 400

    transactions = []

    for _, transaction in df.iterrows():
        # Convert date columns to proper format
        transaction_date = datetime.strptime(transaction["Transaction Date"], "%d-%b-%y") if pd.notna(transaction["Transaction Date"]) else None

        # Convert amounts safely, handling missing or non-numeric values
        debit_amount = None
        credit_amount = None

        if pd.notna(transaction["Debit Amount"]):
            try:
                debit_amount = float(transaction["Debit Amount"])
            except ValueError:
                debit_amount = None  # If conversion fails, set to None

        if pd.notna(transaction["Credit Amount"]):
            try:
                credit_amount = float(transaction["Credit Amount"])
            except ValueError:
                credit_amount = None

        new_transaction = Transaction(
            user_id=current_user.id,
            transaction_date=transaction_date,
            debit_amount=debit_amount,
            credit_amount=credit_amount,
            description=transaction["Client Reference"] if pd.notna(transaction["Client Reference"]) else "",
            category=None  # Classification happens later
        )
        transactions.append(new_transaction)

    # Bulk insert into the database
    db.session.bulk_save_objects(transactions)
    db.session.commit()

    # Delete uploaded files after processing.
    for filename in os.listdir(upload_folder):
        file_path = os.path.join(upload_folder, filename)
        os.remove(file_path)

    # Convert NaN values to None (JSON-safe)
    response_data = {
        "message": f"{len(transactions)} transactions saved successfully.",
        "transactions": [transaction.to_dict() for transaction in transactions]
    }

    response = make_response(jsonify(response_data))
    response.headers["Content-Type"] = "application/json"  # Explicitly set JSON response type
    return response


@plan.route("/submit_classification_batch", methods=["POST"])
@login_required
def submit_classification_batch():
    client = OpenAI()

    # Get all Transactions belonging to current user that are not classified
    transactions = Transaction.query.filter(Transaction.category == None, Transaction.debit_amount > 0,
                                            Transaction.user_id == current_user.id).all()

    if not transactions:
        return jsonify({"error": "No transactions to classify."}), 400
    
    categorize_system_prompt = '''Classify the following bank transaction into one of these categories: [housing, food, transportation, shopping, entertainment, utilities, others]
If you cannot determine the class, classify as: others
Output a json object containing the following information:
{
    category: string // Category based on the transaction description,
}
'''
    # Creating an array of json tasks
    tasks = []
    for transaction in transactions:
        description = transaction.description
        task = {
            "custom_id": f"task-{transaction.id}",
            "method": "POST",
            "url": "/v1/chat/completions",
            "body": {
                "model": "gpt-4o-mini",
                "temperature": 0,
                "response_format": { 
                    "type": "json_object"
                },
                "messages": [
                    {
                        "role": "system",
                        "content": categorize_system_prompt
                    },
                    {
                        "role": "user",
                        "content": description
                    }
                ],
            }
        }
        tasks.append(task)

    # Creating the file
    file_name = "batch_tasks_transactions.jsonl"

    # Get the upload folder from app config
    upload_folder = current_app.config["UPLOAD_FOLDER"]

    file_path = os.path.join(upload_folder, file_name)

    with open(file_path, 'w') as file:
        for obj in tasks:
            file.write(json.dumps(obj) + '\n')

    # Upload batch file
    batch_file = client.files.create(file=open(file_path, "rb"), purpose="batch")

    # Create batch job
    batch_job = client.batches.create(
                    input_file_id=batch_file.id,
                    endpoint="/v1/chat/completions",
                    completion_window="24h"
                )
    
    # Wait for batch job to complete
    batch_job = client.batches.retrieve(batch_job.id)
    while(batch_job.status not in ['completed', 'failed', 'expired', 'cancelled']):
        time.sleep(5)  # Wait before checking again
        batch_job = client.batches.retrieve(batch_job.id)

    # If batch returned without 'complete' status, return error message with batch id & status
    if(batch_job.status != 'completed'):
        return jsonify({"error": f"Batch job {batch_job.id} was returned with status of {batch_job.status}"}), 400

    # Get results of batch job
    result_file_id = batch_job.output_file_id
    result = client.files.content(result_file_id).content

    # Save results to /uploads folder
    result_file_name = "batch_task_transactions_results.jsonl"
    result_file_path = os.path.join(upload_folder, result_file_name)
    with open(result_file_path, 'wb') as file:
        file.write(result)
    
    return jsonify({"message": f"Batch job {batch_job.id} is completed and saved"}), 200



@plan.route("/process_classification_batch", methods=["POST"])
@login_required
def process_classification_batch():
    # Get the upload folder from app config
    upload_folder = current_app.config["UPLOAD_FOLDER"]

    # Loading data from saved file
    result_file_name = "batch_task_transactions_results.jsonl"
    result_file_path = os.path.join(upload_folder, result_file_name)
    results = []
    try:
        with open(result_file_path, 'r') as file:
            for line in file:
                # Parsing the JSON string into a dict and appending to the list of results
                json_object = json.loads(line.strip())
                results.append(json_object)
    except FileNotFoundError:
        return jsonify({"error": f"{result_file_name} could not found at {upload_folder}"}), 400

    transactions = []
    # Updating category of classified Trasctions
    for res in results:
        task_id = res['custom_id']        
        transaction_id = task_id.split('-')[-1] # Getting transaction id from task id
        transaction = Transaction.query.get(transaction_id)  # Fetch by primary key
        category = eval(res['response']['body']['choices'][0]['message']['content'])['category'] # Get category
        transaction.category = category  # Update the category
        transactions.append(transaction)
        db.session.commit()

    # Delete uploaded .jsonl after processing.
    for filename in os.listdir(upload_folder):
        file_path = os.path.join(upload_folder, filename)
        os.remove(file_path)

    return jsonify({"message": f"All {len(results)} transactions have been classified",
                    "transactions": transactions}), 200