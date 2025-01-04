from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_user, logout_user, current_user, login_required
import json

from myapp.blueprints.portfolio.models import Portfolio
from myapp.app import db


portfolio = Blueprint('portfolio', __name__, template_folder='templates', static_folder='static')

# Portfolio types
portfolio_types = {0:"Endowment", 1:"Factor based", 2:"Includes cash", 3:"Risk parity", 4:"Traditional"}

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

    return render_template('portfolio/modal.html', portfolios=portfolios_dict, portfolio_types=portfolio_types)
