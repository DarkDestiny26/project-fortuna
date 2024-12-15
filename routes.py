from models import User
from flask import render_template, request, redirect, url_for
from flask_login import login_user, logout_user, current_user, login_required

def register_routes(app, db, bcrypt):

    @app.route('/')
    def index():
        users = User.query.all()
        return str(users)
    
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'GET':
            return render_template('login.html')
        elif request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')

            user = User.query.filter(User.username == username).first()
            
            # If username does not exist in database
            if not user:
                return "This user doesnt exist womp womp"

            if bcrypt.check_password_hash(user.password_hash, password):
                login_user(user)
                return redirect(url_for('home'))
            else:
                return 'U typed the wrong password baka!'
            
    
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'GET':
            return render_template('register.html')
        elif request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

            user = User(username=username, password_hash=password_hash)

            db.session.add(user)
            db.session.commit()

            return redirect(url_for('login'))
        
    
    @app.route('/logout')
    def logout():
        logout_user()
        return 'You are logged out'
    
    @app.route('/home')
    @login_required
    def home():
        return render_template('home.html', username=current_user.username)
