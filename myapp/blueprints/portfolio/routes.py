from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required


portfolio = Blueprint('portfolio', __name__, template_folder='templates', static_folder='static')

@portfolio.route('/')
@login_required
def nigga():
    return redirect(url_for('home/dashboard'))
