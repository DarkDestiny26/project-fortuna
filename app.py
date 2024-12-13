from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:julianwong7828@localhost:5432/testdb'

    db.init_app(app)
     
    from routes import register_routes
    register_routes(app)

    migrate = Migrate(app, db)

    return app
    