from flask import render_template, request, redirect, url_for, Blueprint, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.auth.models import FinancialGoal
from myapp.blueprints.portfolio.models import UserPortfolio
from myapp.app import db

from datetime import datetime
import os
from openai import OpenAI

chatbot = Blueprint('chatbot', __name__, template_folder='templates', static_folder='static')

@chatbot.route('/')
@login_required
def index():
    current_time = datetime.now().strftime("%H:%M")
    return render_template('chatbot/chatbot.html', current_time=current_time)


# Create an Assistant when a user first visits the chatbot interface
@chatbot.route("/init_chat")
@login_required
def init_chat():
    try:
        client = OpenAI()

        # Retrieve assistant from assistant_id in .env file
        assistant_id = os.getenv("OPENAI_ASSISTANT_ID")
        assistant = client.beta.assistants.retrieve(assistant_id)

        # Create a new Thread with initial assistant message
        thread = client.beta.threads.create(
            messages=[
                {
                "role": "assistant",
                "content": "Hello! I'm Fortuna, your personal AI financial advisor. How can I help you today with your wealth management journey?",
                }
            ]
        )

        # Store the assistant and thread IDs in the session
        session["assistant_id"] = assistant.id
        session["thread_id"] = thread.id

        return jsonify({"assistant_id": assistant.id, "thread_id": thread.id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@chatbot.route('/get_model_response', methods=['POST'])
@login_required
def get_model_response():
    data = request.json
    user_input = data.get("message")

    # Get assistant and thread IDs from session
    assistant_id = session["assistant_id"]
    thread_id = session["thread_id"]

    client = OpenAI()

    # Add a user input to the Thread
    user_message = client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=user_input
    )

    # Create a run and wait for run to finish
    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread_id,
        assistant_id=assistant_id,
    )

    # Return model response
    if run.status == 'completed': 
        messages = client.beta.threads.messages.list(
            thread_id=thread_id
        )
        model_response = messages.data[0].content[0].text.value
        print(messages.data)
        return jsonify({'response':model_response}), 200
    else:
        print(run)
        return jsonify({'error':f"Run failed with status:{run.status}"}), 400

    # import time
    # time.sleep(2)
    # return jsonify({'response':'This is a bot message'}), 200





