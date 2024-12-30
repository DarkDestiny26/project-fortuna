from flask import render_template, request, redirect, url_for, Blueprint
from flask_login import login_user, logout_user, current_user, login_required


portfolio = Blueprint('portfolio', __name__, template_folder='templates', static_folder='static')

# Sample portfolio data
portfolios = [
    {"name": "Total Stock Market Portfolio", "type": [4], 
     "short description":"The Total Stock Market Portfolio is the simplest and most cost-effective way for anyone to invest their money without overthinking it.",
     "long description":"In contrast to the common advice to never put all of your eggs in one basket, the Total Stock Market portfolio does just the opposite. Buy a single total market stock fund and for the most part just ignore it. It doesn't get much simpler than that! \
While hardcore asset allocation fans may think that sounds way too simplistic, there's a lot of merit to the idea that young investors are best served by spending less time on fine tuning their portfolios and more time on earning and saving. \
The most articulate advocate for this line of thinking today is perhaps JL Collins. Here's what he has to say about the idea of putting everything in a total market fund and calling it a day: \
Owning 100% stocks like this is considered “very aggressive.”  It is and you should be.  You have decades ahead.  Market ups and downs don't matter 'cause you avoid panic and stay the course. \
If anything, you recognize them as the “stocks on sale” buying opportunities they are.  Perhaps 40 years from now you might want to add a Bond Index Fund to smooth out the ups and downs.  Worry about that 40 years from now. \
Collins has a substantial following in the FIRE community, and the Total Stock Market Portfolio (which he refers to as the Wealth Building Portfolio) is a staple among aggressive young investors looking to race to financial independence. \
It's a good choice for people who want to truly keep it simple and who are willing and able to power through the inevitable drawdowns that come with a volatile asset allocation.",
     "allocation":{"Total Stock Market":100}, "image_url": "total.png"},
    {"name": "Weird Portfolio", "type": [1,3],
     "short description":"The Weird Portfolio by Value Stock Geek combines factor investing and risk parity concepts into an asset allocation designed to maximize returns and minimize stress.",
     "long description":"Value Stock Geek has an interesting and refreshingly honest approach to investing. Because he is a natural stock picker and value investor who enjoys researching individual companies, one might think that he'd not be the biggest fan of passive asset allocation. \
But to the contrary — the Weird Portfolio is his solution for establishing a secure investing foundation that allows him to invest in what he calls his “speculative” portfolio without worry. \
True to his value investing moniker , the Weird Portfolio commits to small and value stock allocations over traditional cap-weighted funds. Beyond simply expanding into international markets, it also incorporates modern risk parity concepts with multiple volatile \
assets like gold, REITs, and long term treasuries to balance each other out and generate consistent returns in any economic condition. With multiple complementary assets including international diversification and factor investing ideas, the Weird Portfolio may \
indeed seem strange in an old-school sense but is a decidedly contemporary mix of popular investing concepts.",
      "allocation":{"Small Cap Value":20, "International Small Cap Blend":20, "Long Term Bonds":20, "REITs":20, "Gold":20}, "image_url": "weird.png"},
    {"name": "Core Four Portfolio", "type": [4],
     "short description":"The Core Four Portfolio by Rick Ferri invests in four fundamentally unique asset types that are productive both on their own and as a group.",
     "long description":"Rick Ferri has long been a vocal champion of low-cost DIY investing, and the Core Four Portfolio represents his best advice for people who want to escape high fees and complex asset allocations.The four assets in the Core Four are selected based on the following characteristics:\n\
1. All have an economic purpose that is fundamentally different from each other.\n2. All produce regular cash-flow from interest, dividends or rents.\n3. The historic correlations between asset classes have resulted in a diversification benefit.\n\
4. All asset classes can be purchased using a very-low cost index fund or ETF.\n A notable part of Ferri's philosophy is evident in the juxtaposition of points 2 and 3. While some portfolios select assets primarily for how they affect overall performance \
as a group, Ferri believes that they should also stand on their own with regular cash-flow. The Core Four Portfolio does a nice job of distilling several similar portfolios down to their simplest form, and is a good choice for investors seeking a solid financial \
foundation with low fees and minimum complexity.",
     "allocation":{"Domestic Stocks":48, "International Stocks":24, "Intermediate Bonds":20, "REITs":8}, "image_url": "core_4.png"},
    {"name": "No-Brainer Portfolio", "type": [2,4],
     "short description":"The No-Brainer Portfolio by William Bernstein is a simple and straightforward approach to asset, region, and factor diversification that accomplishes all three in just four assets.",
     "long description":"The No-Brainer Portfolio, also sometimes called the Simpleton's Portfolio, is an interesting study in asset allocation. Bernstein is a self-described “asset junkie” who enjoys discussing all types of increasingly sophisticated portfolios \
custom designed for unique investor needs and fine-tuned with advanced concepts like efficient frontiers. While the No-Brainer Portfolio is just the simplest introductory idea in The Intelligent Asset Allocator, I also think it uniquely expresses some of his most fundamental insights.\n\
Bernstein tends to talk about his ideas self-deprecatingly in terms of naive but effective diversification, but the thing I find most interesting is how the No-Brainer Portfolio tackles three different types of diversification in the most efficient way possible. By adding small cap stocks, international stocks, \
and short term bonds to a traditional large cap stock fund, it demonstrates how easy it is to construct a well-considered asset allocation that doesn't depend so much on the handful of large cap companies that tend to dominate stock returns. For a lot of people looking for maximum diversification with minimum effort, that really is a no-brainer.",
     "allocation":{"Large Cap Blend":25, "Small Cap Blend":25, },
     "image_url": "no_brainer.png"},
    {"name": "Pin Wheel Portfolio", "type": [1,2],
     "short description":"The Pinwheel Portfolio provides broad asset diversification that builds upon the four traditional asset classes with performance-enhancing tilts.",
     "long description":"Browse enough portfolios and you'll start to notice a pattern where a large number of financial professionals all recommend the same common assets — domestic stocks, international stocks, intermediate bonds, and real estate. The Pinwheel Portfolio adopts each of those four assets in equal weights, \
and adds one complementary asset of each type to boost returns and minimize risk.\n1. Domestic Stocks > Small Cap Value\n2. International Stocks > Emerging Markets\n3. Intermediate Bonds > Cash\n4. Real Estate > Gold\nThe end result is a uniquely balanced portfolio with an intelligently modern twist on a traditional 4-asset \
foundation. Featuring high returns and healthy withdrawal rates, it's a good portfolio choice for both accumulators and retirees. And it's also an easy evolution for many investors looking to add new assets to the ones they already own.",
     "allocation":{"Large Cap Blend":15, "Small Cap Value":10, "International Stocks":15, "Emerging Markets":10, "Intermediate Bonds":15, "Cash":10, "REITs":15, "Gold":10},
     "image_url": "pin_wheel.png"},
    {"name": "Golden Butterfly Portfolio", "type": [1,2,3],
     "short description":"The Golden Butterfly Portfolio prioritizes consistently desirable investment growth by balancing economic conditions with an eye towards prosperity.",
     "long description":"The Golden Butterfly Portfolio is built on the idea of economic risk parity, similar to the Permanent Portfolio which shares four of its five assets. But while the Permanent Portfolio equally balances prosperity, recession, inflation, and deflation, the Golden Butterfly tilts the assets towards prosperity with an additional allocation to small cap value.\n\
While to some that may seem like a trendy choice destined to underperform, the data reveals a remarkable truth. The Golden Butterfly is one of the best risk-adjusted portfolios out there, pairing the famous consistency of the Permanent Portfolio and the growth rates of far more aggressive options. \
With a tight band of growth paths that are helpful for future estimates and notably high withdrawal rates that are great for retirees, it's a particularly dependable portfolio option suitable for both accumulators and retirees alike.",
     "allocation":{"Large Cap Blend":20, "Small Cap Value":20, "Long Term Bonds":20, "Short Term Bonds":20, "Gold":20},
     "image_url": "golden.png"}
]

# Portfolio types
portfolio_types = {0:"Endowment", 1:"Factor based", 2:"Includes cash", 3:"Risk parity", 4:"Traditional"}

@portfolio.route('/')
@login_required
def index():
    return render_template('portfolio/portfolio.html', portfolios=portfolios, portfolio_types=portfolio_types)
