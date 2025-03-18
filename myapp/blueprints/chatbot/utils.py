# Functions to support tool calling feature of Assistants API
from myapp.blueprints.portfolio.models import Portfolio, UserPortfolio
from myapp.blueprints.auth.models import Questionaire, FinancialGoal
from myapp.blueprints.plan.models import Transaction
from datetime import datetime

def get_portfolios(p_name):
    """
    Queries the database for Portfolio objects with a specific name.
    Returns the portfolio as a string.
    If p_name=All, returns all portfolios.
    """
    if p_name == 'All':
        portfolios = Portfolio.query.all()
        portfolio_list = [p.to_dict() for p in portfolios]
        return str(portfolio_list)
    else:
        portfolio = Portfolio.query.filter_by(name=p_name).first()
        return str(portfolio.to_dict())


def get_user_portfolios(user_id):
    """
    Queries the database for all UserPortfolio objects belonging to the current user.
    Returns the user portfolios as a string.
    Returns error message if current user has no UserPortfolio
    """
    user_portfolios = UserPortfolio.query.filter_by(user_id=user_id).all()

    if not user_portfolios:
        return "No portfolios found for the current user."

    up_list = [up.to_dict() for up in user_portfolios]

    return str(up_list)


def get_risk_profile(user_id):
    """
    Queries the database for Questionaire objects of the current user, which represents the user's risk profile.
    Returns the result as a string.
    """
    questionaire = Questionaire.query.filter_by(user_id=user_id).first()

    risk_profile = f'''
# User risk profile
1. The user plans to withdraw money from their investments in {questionaire.start_withdrawal} years
2. Once the user begins withdrawing funds from their investments, they plan to spend all of the funds in {questionaire.spend_funds} years
3. The user describes their knowledge of investments as {questionaire.knowledge}
4. When investing, the user is willing to take {questionaire.risk} risks expecting to earn {questionaire.risk} returns
5. The user owned or currently owns: {[asset for asset in questionaire.investments]}
6. In a hypothetical scenario where the overall stock market lost 25% of its value and an individual stock investment that the user owns also lost 25% of its value, the user will {questionaire.decision}\n
'''
    return risk_profile


def get_financial_goals(user_id):
    """
    Queries the database for all FinancialGoal objects belonging to the current user.
    Returns the financial goals as a string.
    Returns error message if current user has no FinancialGoal
    """
    financial_goals = FinancialGoal.query.filter_by(user_id=user_id).all()

    if not financial_goals:
        return "No financial goals found for the current user."

    fg_list = [fg.to_dict() for fg in financial_goals]

    return str(fg_list)


def get_current_date():
    """
    Returns the current date in the format: '18 March 2025'.
    """
    return datetime.now().strftime("%d %B %Y")


def get_transactions(month, year, user_id):
    """
    Queries the database for all Transaction objects belonging to the current user 
    that occurred in the given month and year.

    :param month: The month to filter transactions (1-12).
    :param year: The year to filter transactions.
    :return: A list of Transaction objects or a message if none are found.
    """
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)  # First day of next year
    else:
        end_date = datetime(year, month + 1, 1)  # First day of next month

    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date < end_date
    ).all()

    if not transactions:
        return f"No transactions found for month:{month}, year:{year}."

    tr_list = [tr.to_dict() for tr in transactions]
    return str(tr_list)  # Returns a list of Transaction objects
