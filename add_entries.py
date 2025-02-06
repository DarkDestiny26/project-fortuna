# Python script for manually adding entries into app database

from myapp.app import create_app
from myapp.app import db
from myapp.blueprints.portfolio.models import Portfolio

app = create_app()

with app.app_context():
    portfolio_types = {0:"Endowment", 1:"Factor based", 2:"Includes cash", 3:"Risk parity", 4:"Traditional"}

    portfolio_1 = Portfolio(
        name="Total Stock Market Portfolio",
        short_description="The Total Stock Market Portfolio is the simplest and most cost-effective way for anyone to invest their money without overthinking it.",
        long_description=[
            "Advocates simplicity by investing in a single total market stock fund and largely ignoring market fluctuations.",
            "Young investors are encouraged to focus on earning and saving rather than fine-tuning portfolios, embracing an aggressive 100% stock allocation.",
            "This approach is ideal for those seeking financial independence through a straightforward, high-risk, high-reward strategy, with the potential to add bonds decades later for stability."
        ],
        labels = [ 
            { "text": "High Risk", "type": "risk" },
            { "text": "Traditional", "type": "label" }
        ],  
        assets = [
            {"name":"Total Stock Market", "allocation":100, "ticker":"VTI"}
        ],
        returns = {
            "oneYear": 20,
            "threeYear": 3,
            "fiveYear": 9
        }
    )

    portfolio_2 = Portfolio(
        name="Weird Portfolio",
        short_description="The Weird Portfolio by Value Stock Geek combines factor investing and risk parity concepts into an asset allocation designed to maximize returns and minimize stress.",
        long_description=[
            "Combines passive asset allocation with active stock picking, serving as a stable foundation for more speculative investments.",
            "Emphasizes small-cap and value stock allocations over traditional cap-weighted funds, aligning with modern value investing principles.",
            "Incorporates risk parity concepts and balancing volatile assets to ensure consistent returns across economic conditions."
        ],
        labels = [ 
            { "text": "Low Risk", "type": "risk" },
            { "text": "Factor based", "type": "label" },
            { "text": "Risk parity", "type": "label" }
        ],
        assets = [
            {"name":"Small Cap Value", "allocation": 20, "ticker": "VBR"},
            {"name":"International Small Cap Blend", "allocation": 20, "ticker": "VSS"},
            {"name":"Long Term Bonds", "allocation": 20, "ticker": "BLV"},
            {"name":"REITs", "allocation": 20, "ticker": "VNQ"},
            {"name":"Gold", "allocation": 20, "ticker": "IAUM"}
        ],  
        returns = {
            "oneYear": 5,
            "threeYear": -4,
            "fiveYear": 1
        }
    )

    portfolio_3 = Portfolio(
        name="Core Four Portfolio",
        short_description="The Core Four Portfolio by Rick Ferri invests in four fundamentally unique asset types that are productive both on their own and as a group.",
        long_description=[
            "Includes four assets that serve distinct economic purposes, generate regular cash flow, and provide diversification through low historic correlations.",
            "All asset classes are accessible via low-cost index funds or ETFs, ensuring simplicity and affordability.",
            "Balances individual asset performance with overall diversification, offering a solid and straightforward financial foundation."
        ],
        labels = [ 
            { "text": "High Risk", "type": "risk" },
            { "text": "Traditional", "type": "label" }
        ],
        assets= [
                { "name": "Domestic Stocks", "allocation": 48, "ticker": "VOO" },
                { "name": "International Stocks", "allocation": 24, "ticker": "VEU"},
                { "name": "Intermediate Bonds", "allocation": 20, "ticker": "BIV" },
                { "name": "REITs", "allocation": 8, "ticker": "VNQ" }
        ],
        returns = {
            "oneYear": 11,
            "threeYear": 0,
            "fiveYear": 5
        }
    )

    portfolio_4 = Portfolio(
        name="No-Brainer Portfolio",
        short_description="The No-Brainer Portfolio by William Bernstein is a simple and straightforward approach to asset, region, and factor diversification that accomplishes all three in just four assets.",
        long_description=[
            "Simplifies asset allocation by combining large-cap stocks with small-cap stocks, international stocks, and short-term bonds for efficient diversification.",
            "Reflects Bernstein's core insights on achieving naive yet effective diversification with minimal effort.",
            "Offers a straightforward way to reduce reliance on large-cap companies and achieve broad market exposure."
        ],
        labels = [ 
            { "text": "Medium Risk", "type": "risk" },
            { "text": "Traditional", "type": "label" },
            { "text": "Includes cash", "type": "label" }
        ],
        assets = [
                { "name": "Large Cap Blend", "allocation": 25, "ticker": "VOO" },
                { "name": "Small Cap Blend", "allocation": 25, "ticker": "VB" },
                { "name": "International Stocks", "allocation": 25, "ticker": "VEU" },
                { "name": "Short Term Bonds", "allocation": 25, "ticker": "BSV" }
        ],
        returns = {
            "oneYear": 9,
            "threeYear": 0,
            "fiveYear": 4
        }
    )

    portfolio_5 = Portfolio(
        name="Pin Wheel Portfolio",
        short_description="The Pinwheel Portfolio provides broad asset diversification that builds upon the four traditional asset classes with performance-enhancing tilts.",
        long_description=[
            "Builds on a traditional 4-asset foundation by adding complementary assets to enhance returns and reduce risk.",
            "Substitutes small-cap value for domestic stocks, emerging markets for international stocks, cash for intermediate bonds, and gold for real estate.",
            "This balanced and modern portfolio offers high returns, healthy withdrawal rates, and is suitable for both accumulators and retirees."
        ],
        labels = [ 
            { "text": "Medium Risk", "type": "risk" },
            { "text": "Factor based", "type": "label" },
            { "text": "Includes cash", "type": "label" }
        ],
        assets = [
                { "name": "Large Cap Blend", "allocation": 15, "ticker": "VOO" },
                { "name": "Small Cap Value", "allocation": 10, "ticker": "VBR" },
                { "name": "International Stocks", "allocation": 15, "ticker": "VEU" },
                { "name": "Emerging Markets", "allocation": 10, "ticker": "VWO" },
                { "name": "Intermediate Bonds", "allocation": 15, "ticker": "BIV" },
                { "name": "Cash", "allocation": 10, "ticker": "VGSH" },
                { "name": "REITs", "allocation": 15, "ticker": "VNQ" },
                { "name": "Gold", "allocation": 10, "ticker": "IAUM" }
        ],
        returns = {
            "oneYear": 8,
            "threeYear": -1,
            "fiveYear": 2
        }
    )

    portfolio_6 = Portfolio(
        name="Golden Butterfly Portfolio",
        short_description="The Golden Butterfly Portfolio prioritizes consistently desirable investment growth by balancing economic conditions with an eye towards prosperity.",
        long_description=[
            "Builds on the Permanent Portfolio's economic risk parity, adding a small-cap value tilt to emphasize prosperity.",
            "It offers exceptional risk-adjusted returns, combining the stability of the Permanent Portfolio with growth rates of more aggressive strategies."
            "With consistent growth paths and high withdrawal rates, it is a reliable choice for both accumulators and retirees."
        ],
        labels = [ 
            { "text": "Low Risk", "type": "risk" },
            { "text": "Factor based", "type": "label" },
            { "text": "Includes cash", "type": "label" },
            { "text": "Risk Parity", "type": "label" }
        ],
        assets = [
                { "name": "Large Cap Blend", "allocation": 20, "ticker": "VOO" },
                { "name": "Small Cap Value", "allocation": 20, "ticker": "VBR" },
                { "name": "Long Term Bonds", "allocation": 20, "ticker": "BLV" },
                { "name": "Short Term Bonds", "allocation": 20, "ticker": "BSV" },
                { "name": "Gold", "value": 20, "allocation": "IAUM" }
        ],
        returns = {
            "oneYear": 9,
            "threeYear": -1,
            "fiveYear": 2
        }
    )

    db.session.add(portfolio_6)
    db.session.commit()
    print(f"{portfolio_6.name} added successfully!")