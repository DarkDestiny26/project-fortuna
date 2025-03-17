from flask import render_template, request, redirect, url_for, Blueprint, jsonify
from flask_login import login_required, current_user
import json, yfinance as yf, pandas as pd
from datetime import datetime

from myapp.blueprints.portfolio.models import Portfolio, UserPortfolio
from myapp.blueprints.auth.models import Questionaire, FinancialGoal
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
        portfolio_name = data.get("portfolio_name", "")
        portfolio = Portfolio.query.filter_by(name=portfolio_name).first()
        return jsonify({"daily_return": portfolio.daily_return})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@portfolio.route('/add_portfolio', methods=['POST'])
def add_portfolio():
    try:
        data = request.get_json()
        portfolio = data.get("portfolio")
        fund_amount = data.get("fund_amount")

        user_id = current_user.id
        tickers = [asset["ticker"] for asset in portfolio["assets"]]
        allocations = [asset["allocation"] / 100 for asset in portfolio["assets"]]

        # Fetch latest stock prices
        prices = yf.download(tickers, period="1d", interval="1m")["Close"].iloc[-1]

        # Compute allocated amount and number of shares
        assets = [
            {"ticker": ticker, "units": (fund_amount * alloc) / float(prices[ticker])}
            for ticker, alloc in zip(tickers, allocations)
        ]

        # Create UserPortfolio entry
        user_portfolio = UserPortfolio(user_id=user_id, portfolio_id=portfolio['id'], added_on=datetime.now(), value=fund_amount, assets=assets)

        print(user_portfolio)
        db.session.add(user_portfolio)
        db.session.commit()

        return jsonify({"status": "success", "message": "Portfolio added successfully!"})
    
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@portfolio.route('/get_recommended_portfolios', methods=['POST'])
@login_required
def get_recommended_portfolios():

    # Query all Portfolios from db
    portfolios = Portfolio.query.all()
    portfolio_list = [portfolio.to_dict() for portfolio in portfolios]  # Convert all portfolios to dict
    portfolios_str = json.dumps(portfolio_list, indent=2)  # Convert dict into JSON str

    # Define system prompt
    system_prompt = '''
Use the provided risk profile and financial goals to determine the most suitable financial portfolios for the user. Consider factors such as risk tolerance, financial goals, and time horizon.

# Steps
1. **Analyze Risk Profile and Financial Goals**: Examine the user's risk tolerance, investment goals, and time horizon.
2. **Portfolio Selection**: Match the user's profile with the given financial portfolios that align with their risk level and objectives.
3. **Justification**: Provide a rationale for the recommended portfolios, explaining how they align with the user's risk profile and financial goals.

# Output instructions
Provide the recommended financial portfolios in JSON format, including:
- User's risk profile summary in 2-3 short sentences
- Recommended portfolios
- 2-3 short justifications for each recommendation, with reference to the user's risk profile and financial goals

# Portfolios\n''' + portfolios_str + '''\n# Example Output Format
{
  "summary": [
    "Based on your investment knowledge and willingness to take higher than average risks, you are comfortable with volatility over a medium-term horizon.",
    "Your near-term objective of saving $2000 by mid-2025 for a new PC, combined with the longer-term goal of gathering $50000 by 2030 for a business startup, suggests a need for portfolios that balance growth potential with some risk mitigation."
  ],
  "portfolios": [
    {
      "name": "Core Four Portfolio",
      "reasons": [
        "This portfolio offers a diversified mix with a heavy equity allocation (domestic and international stocks) balanced by a meaningful bond component, which can help cushion short-term downturns while pursuing growth.",
        "Its inclusion of a variety of asset classes aligns with your current holdings in stocks, bonds, and international securities, making it a well-rounded option for both near-term liquidity and longer-term appreciation.",
        "The mix of 72% equities and 28% fixed income/reits provides a balance that supports your high risk tolerance while addressing your need for funds in 3-5 years."
      ]
    },
    {
      "name": "Total Stock Market Portfolio",
      "reasons": [
        "This portfolio is fully exposed to equities, maximizing the potential for high returns, which suits your willingness to take on higher than average risk.",
        "It is especially geared toward long-term growth, making it ideal for your goal of saving $50000 by 2030 to start a business.",
        "Given that you stated you would remain undistracted during market downturns, the aggressive 100% equity approach can work well for the portion of your funds designated for long-term investing."
      ]
    }
  ]
}
'''
    
    # Get risk profile of current user from questionaire answers
    questionaire = Questionaire.query.filter_by(user_id=current_user.id).first()
    
    user_risk_profile=f'''
# User risk profile
1. The user plans to withdraw money from their investments in {questionaire.start_withdrawal} years
2. Once the user begins withdrawing funds from their investments, they plan to spend all of the funds in {questionaire.spend_funds} years
3. The user describes their knowledge of investments as {questionaire.knowledge}
4. When investing, the user is willing to take {questionaire.risk} risks expecting to earn {questionaire.risk} returns
5. The user owned or currently owns: {[asset for asset in questionaire.investments]}
6. In a hypothetical scenario where the overall stock market lost 25% of its value and an individual stock investment that the user owns also lost 25% of its value, the user will {questionaire.decision}\n
'''
    
    # Get financial goals of current user from questionaire answers
    goals = FinancialGoal.query.filter_by(user_id=current_user.id).all()

    user_financial_goals = "# User financial goals\n"
    for i, goal in enumerate(goals):
        user_financial_goals += f"{i+1}. The user wants to save ${goal.target_amount} by {goal.target_date.strftime("%#d %b %Y")} to {goal.name}\n"

    from openai import OpenAI
    client = OpenAI()

    response = client.chat.completions.create(
        model="o3-mini",
        reasoning_effort="high",
        response_format={ 
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_risk_profile + user_financial_goals
            }
        ],
    )
    return jsonify(eval(response.choices[0].message.content)), 200
