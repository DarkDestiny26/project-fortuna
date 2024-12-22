from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required

from myapp.blueprints.auth.models import User
from myapp.app import db

home = Blueprint('home', __name__, template_folder='templates', static_folder='static')

@home.route('/')
@login_required
def homepage():
    return render_template('home/home.html', username=current_user.username)

@home.route('/dashboard')
@login_required
def dashboard():
    return render_template('home/dashboard.html')

@home.route('/dashboard2')
@login_required
def dashboard2():
    return render_template('home/dashboard2.html')