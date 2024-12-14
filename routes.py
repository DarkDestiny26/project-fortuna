from models import User
from flask import render_template

def register_routes(app):

    @app.route('/')
    def index():
        users = User.query.all()
        return str(users)
    
    @app.route('/login')
    def login():
        return render_template('login.html')
