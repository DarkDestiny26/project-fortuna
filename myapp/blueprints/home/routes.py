from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required

from myapp.blueprints.auth.models import User
from myapp.app import db

home = Blueprint('home', __name__, template_folder='templates')

@home.route('/')
@login_required
def homepage():
    return render_template('home/home.html', username=current_user.username)
