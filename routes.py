from models import User

def register_routes(app):

    @app.route('/')
    def index():
        users = User.query.all()
        return str(users)