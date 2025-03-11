from myapp.app import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_date = db.Column(db.Date, nullable=False)
    debit_amount = db.Column(db.Float, nullable=True)
    credit_amount = db.Column(db.Float, nullable=True)
    description = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=True)  # Classified category
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<Transaction {self.reference} - {self.debit_amount or self.credit_amount}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "transaction_date": self.transaction_date,
            "debit_amount": self.debit_amount,
            "credit_amount": self.credit_amount,
            "description": self.description,
            "category": self.category,
            "created_at": self.created_at,
        }