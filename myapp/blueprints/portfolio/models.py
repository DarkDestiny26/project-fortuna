from flask import app
from myapp.app import db
import yfinance as yf, time, threading
from datetime import datetime

    
# Define the Portfolios table
class Portfolio(db.Model):
    __tablename__ = 'portfolios'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    labels = db.Column(db.JSON, nullable=True) # Array of JSON to store labels -> {"text"="label_text", "type"=["risk" or "label"]}
    short_description = db.Column(db.Text, nullable=True)
    long_description = db.Column(db.ARRAY(db.String), nullable=True) # Array of strings -> ["1st_sentence", "2nd_sentence", ... "last_sentence"]
    assets = db.Column(db.JSON, nullable=True)  # Array of JSON to store asset allocations -> {"name"="asset_category", "ticker"="ticker_symbol", allocation="percentage(%)"}
    annual_returns = db.Column(db.JSON, nullable=True) # JSON to store annual returns -> {"oneYear"="one_year_return", "threeYear"="three_year_return", "fiveYear"="five_year_return"}
    daily_return = db.Column(db.Float, nullable=True)  # Store portfolio's daily return = (current price - latest close)/latest close

    def __repr__(self):
        return f"<Portfolio {self.name}>"
    
    def update_daily_return(self):
        if not self.assets:
            return
        
        total_return = 0.0

        for asset in self.assets:
            ticker = asset.get("ticker")
            allocation = asset.get("allocation", 0) / 100  # Convert percentage to decimal
            
            if ticker and allocation > 0:
                try:
                    stock = yf.Ticker(ticker)
                    hist = stock.history(period="2d")  # Get last two days' data
                    if len(hist) >= 2:
                        latest_close = hist["Close"].iloc[-2]
                        current_price = hist["Close"].iloc[-1]
                        daily_return = (current_price - latest_close) / latest_close
                        total_return += daily_return * allocation
                except Exception as e:
                    print(f"Error fetching data for {ticker}: {e}")
       
        self.daily_return = float(total_return)
    
        db.session.commit()
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "labels": self.labels,
            "short_description": self.short_description,
            "long_description": self.long_description,
            "assets": self.assets,
            "daily_return": self.daily_return,
            "annual_returns": self.annual_returns,
        }


# Define the UserPortfolios table
class UserPortfolio(db.Model):
    __tablename__ = 'user_portfolios'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.id'), nullable=False)
    added_on = db.Column(db.DateTime, default=db.func.current_timestamp())
    value = db.Column(db.Float, nullable=True)  # Store portfolio value
    assets = db.Column(db.JSON, nullable=True)  # Array of JSONs to store fractional unit of each asset -> {"ticker"="ticker_symbol", "units"="fractional_value"}

    # Relationship to the Portfolio table
    portfolio = db.relationship('Portfolio', backref=db.backref('user_portfolios', lazy=True))

    def __repr__(self):
        return f"<UserPortfolio user_id={self.user_id} portfolio_id={self.portfolio_id}>"

    def update_value(self):
        """
        Updates the portfolio value based on the latest asset prices from yfinance.
        """
        if not self.assets:
            return

        total_value = 0.0
        for asset in self.assets:
            ticker = asset.get("ticker")
            units = asset.get("units", 0)
            if ticker and units > 0:
                try:
                    stock = yf.Ticker(ticker)
                    latest_close = stock.history(period="1d", interval='1m')["Close"].iloc[-1]
                    total_value += latest_close * units  # Value based on latest stock price
                except Exception as e:
                    print(f"Error fetching data for {ticker}: {e}")

        self.value = float(total_value)
        db.session.commit()


    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "portfolio_id": self.portfolio_id,
            "value": self.value,
            "added_on": self.added_on,
            "assets": self.assets,
            "portfolio": self.portfolio.to_dict() if self.portfolio else None
        }
    
def update_portfolios_value(app):
    """
    Background thread that updates portfolio values every 60 seconds.
    """
    with app.app_context():
        print("[INFO] Portfolio value update thread started...")
        while True:
            user_portfolios = UserPortfolio.query.all()
            for user_portfolio in user_portfolios:
                print(f"[INFO] Updating {user_portfolio.portfolio.name} value...")
                user_portfolio.update_value()
            print("----------------------------")
            time.sleep(60)


def update_portfolio_daily_returns(app):
    """
    Background thread that updates portfolio daily returns every 60 seconds.
    """
    with app.app_context():
        print("[INFO] Daily return update thread started...")
        while True:
            portfolios = Portfolio.query.all()
            for portfolio in portfolios:
                print(f"[INFO] Updating daily return for {portfolio.name}...")
                portfolio.update_daily_return()
            print("----------------------------")
            time.sleep(60)  # Run once every 24 hours



# Start the background thread after Flask app initialization
def start_background_thread(app):
    thread_1 = threading.Thread(target=update_portfolios_value, args=(app,), daemon=True)
    thread_2 = threading.Thread(target=update_portfolio_daily_returns, args=(app,), daemon=True)
    thread_1.start()
    thread_2.start()