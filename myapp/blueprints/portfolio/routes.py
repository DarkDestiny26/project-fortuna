from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required


portfolio = Blueprint('portfolio', __name__, template_folder='templates', static_folder='static')

# Sample portfolio data
portfolios = [
    {"name": "Growth Portfolio", "type": "Stocks", "value": "$50,000", "performance": "+15%", "image_url": "/placeholder.svg?height=100&width=100"},
    {"name": "Income Portfolio", "type": "Bonds", "value": "$75,000", "performance": "-5%", "image_url": "/placeholder.svg?height=100&width=100"},
    {"name": "Balanced Portfolio", "type": "Mixed", "value": "$100,000", "performance": "+10%", "image_url": "/placeholder.svg?height=100&width=100"},
    {"name": "Tech Portfolio", "type": "Stocks", "value": "$60,000", "performance": "+20%", "image_url": "/placeholder.svg?height=100&width=100"},
    {"name": "Real Estate Portfolio", "type": "REITs", "value": "$80,000", "performance": "-8%", "image_url": "/placeholder.svg?height=100&width=100"},
    {"name": "International Portfolio", "type": "Stocks", "value": "$70,000", "performance": "+12%", "image_url": "/placeholder.svg?height=100&width=100"},
]

@portfolio.route('/')
@login_required
def index():
    return render_template('portfolio/portfolio.html', portfolios=portfolios)

