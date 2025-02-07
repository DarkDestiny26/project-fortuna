from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required

from myapp.blueprints.auth.models import User
from myapp.app import db

dashboard = Blueprint('dashboard', __name__, template_folder='templates', static_folder='static')

@dashboard.route('/')
@login_required
def index():
    return render_template('dashboard/dashboard.html', username = current_user.username)

@dashboard.route('/test')
@login_required
def index1():
    return render_template('dashboard/dashboard2.html', username = current_user.username)
