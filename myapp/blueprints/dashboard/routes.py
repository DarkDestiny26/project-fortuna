from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.orm import joinedload

from myapp.blueprints.auth.models import User
from myapp.blueprints.portfolio.models import UserPortfolio, Portfolio
from myapp.app import db

dashboard = Blueprint('dashboard', __name__, template_folder='templates', static_folder='static')

@dashboard.route('/')
@login_required
def index():
    # Get all UserPortfolios belonging to current user
    user_portfolios = UserPortfolio.query.options(joinedload(UserPortfolio.portfolio)).filter_by(user_id=current_user.id).all()

    user_portfolios_dict = [up.to_dict() for up in user_portfolios]

    return render_template('dashboard/dashboard.html', username=current_user.username, user_portfolios=user_portfolios_dict)


@dashboard.route('/get_user_portfolios', methods=['POST'])
@login_required
def get_daily_performance():
    try:
        data = request.get_json()
        user_id = data.get("user_id", "")
        user_portfolios = UserPortfolio.query.options(joinedload(UserPortfolio.portfolio)).filter_by(user_id=user_id).all()
        user_portfolios_dict = [up.to_dict() for up in user_portfolios]
        return jsonify({"user_portfolios": user_portfolios_dict})

    except Exception as e:
        return jsonify({"error": str(e)}), 500