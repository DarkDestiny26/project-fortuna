from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.auth.models import FinancialGoal
from myapp.blueprints.portfolio.models import UserPortfolio
from myapp.app import db

plan = Blueprint('plan', __name__, template_folder='templates', static_folder='static')

@plan.route('/')
@login_required
def index():
    return render_template('plan/overview.html')