from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.auth.models import FinancialGoal
from myapp.blueprints.portfolio.models import UserPortfolio
from myapp.app import db

from datetime import datetime

chatbot = Blueprint('chatbot', __name__, template_folder='templates', static_folder='static')

@chatbot.route('/')
@login_required
def index():
    current_time = datetime.now().strftime("%H:%M")
    return render_template('chatbot/chatbot.html', current_time=current_time)


