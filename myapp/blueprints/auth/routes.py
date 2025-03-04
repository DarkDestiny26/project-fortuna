from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required

from myapp.blueprints.auth.models import User
from myapp.app import db

auth = Blueprint('auth', __name__, template_folder='templates', static_folder='static')
bcrypt = None

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('auth/login.html')
    elif request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter(User.username == username).first()
        
        # If username does not exist in database
        if not user:
            return "This user doesnt exist womp womp"

        # If username in database, check password
        if auth.bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard.index'))
        else:
            return 'U typed the wrong password baka!'
    
@auth.route('/create-account')
def create_account():
    return render_template('auth/create_account.html')


@auth.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        password_hash = auth.bcrypt.generate_password_hash(password).decode('utf-8')

        user = User(username=username, password_hash=password_hash)

        db.session.add(user)
        db.session.commit()

        return redirect(url_for('auth.login'))
    

@auth.route('/logout')
def logout():
    logout_user()
    return render_template('auth/logout.html')


