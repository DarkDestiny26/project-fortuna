from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_user, logout_user, current_user, login_required
import json

from myapp.blueprints.portfolio.models import Portfolio, Portfolio2
from myapp.app import db

portfolio = Blueprint('portfolio', __name__, template_folder='templates', static_folder='static')

# Portfolio types
portfolio_types = ["High Risk", "Medium Risk", "Low Risk", "Endowment", "Factor based", "Includes cash", "Risk parity", "Traditional"]

@portfolio.route('/')
@login_required
def index():
    # Query all portfolios
    portfolios = Portfolio.query.all()

    # Convert objects to dictionaries
    portfolios_dict = [portfolio.to_dict() for portfolio in portfolios]

    return render_template('portfolio/portfolio.html', portfolios=portfolios_dict, portfolio_types=portfolio_types)

@portfolio.route('/test')
@login_required
def index1():
    # Query all portfolios
    portfolios = Portfolio.query.all()

    # Convert objects to dictionaries
    portfolios_dict = [portfolio.to_dict() for portfolio in portfolios]

    return render_template('portfolio/portfolio3.html', portfolios=portfolios_dict, portfolio_types=portfolio_types)

@portfolio.route('/test2')
@login_required
def index2():
    # Query all portfolios
    portfolios = Portfolio2.query.all()

    # Convert objects to dictionaries
    portfolios_dict = [portfolio.to_dict() for portfolio in portfolios]

    return render_template('portfolio/portfolio2.html', portfolios=portfolios_dict, portfolio_types=portfolio_types)


@portfolio.route('/invest', methods=['POST'])
@login_required
def invest():
    if request.method == 'POST':
        portfolio = request.form.get('portfolio')
        return render_template('portfolio/invest.html', portfolio=eval(portfolio))
