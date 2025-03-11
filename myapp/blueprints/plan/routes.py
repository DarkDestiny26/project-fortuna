from flask import render_template, request, redirect, url_for, Blueprint, jsonify, current_app
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.plan.models import Transaction
from myapp.app import db

import pandas as pd
import os
from werkzeug.utils import secure_filename
from datetime import datetime

plan = Blueprint('plan', __name__, template_folder='templates', static_folder='static')

@plan.route('/')
@login_required
def index():
    return render_template('plan/overview.html')

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@plan.route("/upload_csv", methods=["POST"])
@login_required
def upload_csv():
    """
    Endpoint to upload a CSV file and store transactions in the database.
    """
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

    for _, row in df.iterrows():
        # Convert date columns to proper format
        transaction_date = datetime.strptime(row["Transaction Date"], "%d-%b-%y") if pd.notna(row["Transaction Date"]) else None
    
        new_transaction = Transaction(
            user_id=current_user.id,
            transaction_date=transaction_date,
            debit_amount=float(row["Debit Amount"]) if pd.notna(row["Debit Amount"]) and row["Debit Amount"].strip() != '' else None,
            credit_amount=float(row["Credit Amount"]) if pd.notna(row["Credit Amount"]) and row["Credit Amount"].strip() != '' else None,
            description=row["Client Reference"],
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

    return jsonify({
        "message": f"{len(transactions)} transactions saved successfully.",
        "next_step": "/classify_transactions"
    })

