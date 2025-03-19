from flask import render_template, request, redirect, url_for, Blueprint, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.auth.models import FinancialGoal
from myapp.blueprints.portfolio.models import UserPortfolio
from myapp.app import db
from myapp.blueprints.chatbot.utils import get_portfolios, get_user_portfolios, get_risk_profile, get_financial_goals, get_transactions, get_current_date

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
                "content": '''
                        <h3>Welcome to Fortuna</h3>
                        <p>Hello! I'm your personal AI financial advisor. I can help you with:</p>
                        <ul>
                            <li>Portfolio analysis and recommendations</li>
                            <li>Investment strategy planning</li>
                            <li>Retirement planning</li>
                            <li>Risk assessment</li>
                        </ul>
                        <p>How can I assist you with your wealth management today?</p>
                        '''
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

    # Return model response if run is completed
    if run.status == 'completed': 
        messages = client.beta.threads.messages.list(
            thread_id=thread_id
        )
        model_response = messages.data[0].content[0].text.value
        print(messages.data)
        return jsonify({'response':model_response}), 200
    
    elif run.status == 'requires_action':
       # Account for mutliple rounds of runs that require function calling
       while run.status == 'requires_action':
            # Define the list to store tool outputs
            tool_outputs = []
            
            # Loop through each tool in the required action section
            for tool in run.required_action.submit_tool_outputs.tool_calls:
                if tool.function.name == "get_portfolios":
                    # Get function arguments dict
                    args_dict = eval(tool.function.arguments)
                    tool_outputs.append({
                        "tool_call_id": tool.id,
                        "output": get_portfolios(args_dict.get('p_name'))
                    })
                elif tool.function.name == "get_user_portfolios":
                    tool_outputs.append({
                        "tool_call_id": tool.id,
                        "output": get_user_portfolios(current_user.id)
                    })
                elif tool.function.name == "get_risk_profile":
                    tool_outputs.append({
                        "tool_call_id": tool.id,
                        "output":get_risk_profile(current_user.id)
                    })
                elif tool.function.name == "get_financial_goals":
                    tool_outputs.append({
                        "tool_call_id": tool.id,
                        "output": get_financial_goals(current_user.id)
                    })
                elif tool.function.name == "get_current_date":
                    tool_outputs.append({
                        "tool_call_id": tool.id,
                        "output": get_current_date()
                    })
                elif tool.function.name == "get_transactions":
                    # Get function arguments dict
                    args_dict = eval(tool.function.arguments)
                    tool_outputs.append({
                        "tool_call_id": tool.id,
                        "output": get_transactions(user_id=current_user.id, 
                                                month=int(args_dict.get("month")), 
                                                year=int(args_dict.get("year")))
                    })
    
            # Submit all tool outputs at once after collecting them in a list
            if tool_outputs:
                try:
                    run = client.beta.threads.runs.submit_tool_outputs_and_poll(
                    thread_id=thread_id,
                    run_id=run.id,
                    tool_outputs=tool_outputs
                    )
                    print("Tool outputs submitted successfully.")

                    # Model successful in generating response with tool output
                    if run.status == 'completed': 
                        messages = client.beta.threads.messages.list(
                            thread_id=thread_id
                        )
                        model_response = messages.data[0].content[0].text.value
                        print(messages.data)
                        return jsonify({'response':model_response}), 200
                    
                    # Run failed when tool output is used in prompt
                    elif run.status != 'requires_action':
                        print(run.status)
                        return jsonify({'error':f"Run failed with status:{run.status}"}), 400
                    
                # Tool outputs failed submission       
                except Exception as e:
                    return jsonify({'error':f"Failed to submit tool outputs: {e}"}), 
                    
            else:
                return jsonify({'error':"No tool outputs to submit."}), 400
        
    # Initial run failed
    else:
        print(run)
        return jsonify({'error':f"Run failed with status:{run.status}"}), 400

    # import time
    # from myapp.blueprints.chatbot.utils import get_transactions

    # time.sleep(2)
    # return jsonify({'response':get_transactions(user_id=current_user.id, month=3, year=2025)}), 200





