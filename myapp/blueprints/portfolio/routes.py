from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_required
import json, yfinance as yf, pandas as pd

from myapp.blueprints.portfolio.models import Portfolio
from myapp.app import db

portfolio = Blueprint('portfolio', __name__, template_folder='templates', static_folder='static')

@portfolio.route('/')
@login_required
def index():
    # Query all portfolios
    portfolios = Portfolio.query.all()

    # Convert objects to Python dictionaries
    portfolios_dict = [portfolio.to_dict() for portfolio in portfolios]

    # Custom sorting function
    def custom_sort(label):
        priority_order = ["High Risk", "Medium Risk", "Low Risk"]
        return (priority_order.index(label) if label in priority_order else len(priority_order), label)

    portfolio_types = list({label["text"] for portfolio in portfolios_dict for label in portfolio["labels"]})

    sorted_types = sorted(portfolio_types, key=custom_sort)

    return render_template('portfolio/portfolio.html', portfolios=portfolios_dict, portfolio_types=sorted_types)


@portfolio.route('/invest', methods=['POST'])
@login_required
def invest():
    if request.method == 'POST':
        portfolio = eval(request.form.get('portfolio'))

        # Get risk level (High, Medium, Low)
        risk_level = [label for label in portfolio["labels"] if label["type"] == "risk"][0]["text"].split()[0]

        return render_template('portfolio/invest.html', portfolio=portfolio, risk_level=risk_level)


@portfolio.route('/get_stock_prices', methods=['POST'])
def get_stock_prices():
    data = request.get_json()
    assets = data.get("assets", [])
    tickers = [asset["ticker"] for asset in assets]

    if not tickers:
        return jsonify({"error": "No tickers provided"}), 400

    stock_data = {}
    
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            history = stock.history(period="1d", interval="1m")  # Get last 2 mins to calculate change
            if not history.empty and len(history) > 1:
                latest_price = float(history["Close"].iloc[-1])  # Latest closing price
                prev_price = float(history["Close"].iloc[-2])  # Previous minute's closing price
                percentage_change = ((latest_price - prev_price) / prev_price) * 100

                stock_data[ticker] = {
                    "price": latest_price,
                    "change": percentage_change
                }
            else:
                stock_data[ticker] = {"error": "No data available"}

        except Exception as e:
            stock_data[ticker] = {"error": str(e)}

    return jsonify(stock_data)


@portfolio.route('/get_portfolio_returns', methods=['POST'])
def get_portfolio_returns():
    data = request.get_json()
    assets = data.get("assets", [])
    tickers = [asset["ticker"] for asset in assets]
    allocations = {asset["ticker"]: asset["allocation"] / 100 for asset in assets}
    # tickers = data.get("tickers", [])
    # allocations = data.get("allocations", {})
    period = data.get("period", "6m")  # Default to 6 months

    if not tickers:
        return jsonify({"error": "No tickers provided"}), 400

    # Map frontend selections to yfinance periods
    period_map = {"6m": "6mo", "1y": "1y", "5y": "5y"}
    yf_period = period_map.get(period, "6mo")

    try:
        stock_data = yf.download(tickers, period=yf_period, interval="1d")["Close"]

        if isinstance(stock_data, pd.Series):  
            stock_data = stock_data.to_frame()

        # Compute portfolio returns
        returns = stock_data.pct_change().dropna()
        weights = pd.Series(allocations)
        portfolio_returns = returns.dot(weights)
        cumulative_returns = (1 + portfolio_returns).cumprod() - 1

        response = {
            "dates": cumulative_returns.index.strftime("%Y-%m-%d").tolist(),
            "returns": cumulative_returns.tolist()
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@portfolio.route('/get_daily_performance', methods=['POST'])
def get_daily_performance():
    try:
        data = request.get_json()
        assets = data.get("assets", [])
        tickers = [asset["ticker"] for asset in assets]
        allocations = {asset["ticker"]: asset["allocation"] / 100 for asset in assets}

        if not tickers:
            return jsonify({"error": "No tickers provided"}), 400

        # Fetch last 2 days of data to calculate daily return
        stock_data = yf.download(tickers, period="2d", interval="1d")["Close"]

        if stock_data.empty:
            return jsonify({"error": "No stock data found"}), 500

        # Convert Series to DataFrame if only one ticker
        if isinstance(stock_data, pd.Series):  
            stock_data = stock_data.to_frame()

        # Ensure allocations match available tickers
        allocations = {ticker: allocations[ticker] for ticker in stock_data.columns if ticker in allocations}
        weights = pd.Series(allocations)

        # Calculate daily return for each stock
        daily_returns = stock_data.pct_change().dropna()

        # Compute portfolio's weighted daily return
        portfolio_daily_return = daily_returns.iloc[-1].dot(weights)  # Latest day's return

        return jsonify({"daily_return": portfolio_daily_return})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
