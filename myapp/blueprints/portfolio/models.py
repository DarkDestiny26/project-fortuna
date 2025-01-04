from myapp.app import db

# Define the Portfolios table
class Portfolio(db.Model):
    __tablename__ = 'portfolios'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.ARRAY(db.String), nullable=True)
    short_description = db.Column(db.Text, nullable=True)
    long_description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(100), nullable=True)
    allocation = db.Column(db.JSON, nullable=True)  # JSON to store allocation details

    def __repr__(self):
        return f"<Portfolio {self.name}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "short_description": self.short_description,
            "long_description": self.long_description,
            "image_url": self.image_url,
            "allocation": self.allocation,
        }


# Define the UserPortfolios table
class UserPortfolio(db.Model):
    __tablename__ = 'user_portfolios'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.id'), nullable=False)
    added_on = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relationship to the Portfolio table
    portfolio = db.relationship('Portfolio', backref=db.backref('user_portfolios', lazy=True))

    def __repr__(self):
        return f"<UserPortfolio user_id={self.user_id} portfolio_id={self.portfolio_id}>"