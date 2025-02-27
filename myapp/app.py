from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt

from dotenv import load_dotenv
import os

db = SQLAlchemy()
load_dotenv()

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.secret_key = os.getenv('FLASK_SECRET_KEY')

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    from myapp.blueprints.auth.models import User

    @login_manager.user_loader
    def load_user(uid):
        return User.query.get(uid)
     
    # import and register blueprints 
    from myapp.blueprints.auth.routes import auth
    from myapp.blueprints.dashboard.routes import dashboard
    from myapp.blueprints.portfolio.routes import portfolio
    
    auth.bcrypt = Bcrypt(app)
    app.register_blueprint(auth, url_prefix='/auth')

    app.register_blueprint(dashboard, url_prefix='/home/dashboard')
    
    app.register_blueprint(portfolio, url_prefix='/home/portfolio')

    migrate = Migrate(app, db)

    from myapp.blueprints.portfolio.models import start_background_thread

    start_background_thread(app)  # Start the background update thread

    return app
    