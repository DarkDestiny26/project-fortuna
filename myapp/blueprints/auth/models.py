from myapp.app import db
from flask_login import UserMixin

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f"username={self.username}"
    
    def get_id(self):
        return self.id
    

class Questionaire(db.Model):
    __tablename__ = 'questionaire'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_withdrawal = db.Column(db.String(10), nullable=False)
    spend_funds = db.Column(db.String(10), nullable=False)
    knowledge = db.Column(db.String(50), nullable=False)
    risk = db.Column(db.String(50), nullable=False)
    investments = db.Column(db.JSON, nullable=True)  # Store as JSON array
    decision = db.Column(db.String(50), nullable=False)
    portfolio = db.Column(db.String(20), nullable=False)

    def __repr__(self):
        return f"<Questionaire user_id={self.user_id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "labels": self.labels,
            "start_withdrawal": self.start_withdrawal,
            "spend_funds": self.spend_funds,
            "knowledge": self.knowledge,
            "risk": self.risk,
            "investments": self.investments,
            "decision": self.decision,
            "portfolio": self.portfolio
        }


class FinancialGoal(db.Model):
    __tablename__ = 'financial_goals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)  # Name of the goal
    amount = db.Column(db.Float, nullable=False)  # Target amount
    target_date = db.Column(db.Date, nullable=False)  # Target completion date
    added_on = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<FinancialGoal {self.name} - {self.amount} by {self.target_date}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "amount": self.amount,
            "target_date": self.target_date,
            "added_on": self.added_on,
        }
