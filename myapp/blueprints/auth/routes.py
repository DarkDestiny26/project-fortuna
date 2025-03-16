from flask import render_template, request, redirect, url_for, Blueprint, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required

from datetime import datetime

from myapp.blueprints.auth.models import User, Questionaire, FinancialGoal
from myapp.app import db

auth = Blueprint('auth', __name__, template_folder='templates', static_folder='static')
bcrypt = None

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('auth/login.html')
    elif request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter(User.username == username).first()
        
        # If username does not exist in database
        if not user:
            return "This user doesnt exist womp womp"

        # If username in database, check password
        if auth.bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard.index'))
        else:
            return 'U typed the wrong password baka!'


@auth.route('/create-account', methods=['GET', 'POST'])
def create_account():
    session['step'] = 'create-account'  # Set the first step

    if request.method == 'POST':
        # Create user
        username = request.form.get('username')
        password = request.form.get('password')
        password_hash = auth.bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()

        # log user in so that we can save user info to db later
        login_user(user)

        session['step'] = 'questionaire'  # Move to the next step
        return redirect(url_for('auth.questionaire')) # Redirect user to next page

    return render_template('auth/create_account.html')


@auth.route('/questionaire', methods=['GET', 'POST'])
def questionaire():
    if session.get('step') != 'questionaire':
        return redirect(url_for('auth.create_account'))  # Redirect if not in sequence
    
    if request.method == 'POST':
        # Retrieve form data from request
        start_withdrawal = request.form.get('startWithdrawal')
        spend_funds = request.form.get('spendFunds')
        knowledge = request.form.get('knowledge')
        risk = request.form.get('risk')
        
        # Retrieve selected investments (checkboxes)
        investments = []
        if 'cash' in request.form:
            investments.append('cash')
        if 'bonds' in request.form:
            investments.append('bonds')
        if 'stocks' in request.form:
            investments.append('stocks')
        if 'international' in request.form:
            investments.append('international securities')

        # Retrieve selected decision in case of market downturn
        decision = request.form.get('decision')

        # Retrieve selected portfolio
        portfolio = request.form.get('portfolio')

        # Store data in session
        session['questionaire'] = {
            'start_withdrawal': start_withdrawal,
            'spend_funds': spend_funds,
            'knowledge': knowledge,
            'risk': risk,
            'investments': investments,
            'decision': decision,
            'portfolio': portfolio
        }

        session['step'] = 'goals'  # Move to the next step
        
        # Redirect user to next page
        return redirect(url_for('auth.financial_goals'))

    return render_template('auth/questionaire.html')


@auth.route('/financial-goals', methods=['GET','POST'])
def financial_goals():
    if session.get('step') != 'goals':
        return redirect(url_for('auth.questionaire'))  # Redirect if not in sequence

    if request.method == 'POST':
        # Process the form data
        goal_names = request.form.getlist('goal_name[]')
        goal_amounts = request.form.getlist('goal_amount[]')
        goal_dates = request.form.getlist('goal_date[]')
        
        # Combine the data into a list of goals
        goals = []
        for i in range(len(goal_names)):
            if i < len(goal_amounts) and i < len(goal_dates):
                goals.append({
                    'name': goal_names[i],
                    'amount': float(goal_amounts[i]),
                    'date': goal_dates[i]
                })
        
        # Store goals in session
        session['financial_goals'] = goals

        session['step'] = 'register'  # Move to the next step

        print(session)

        # Redirect to register route
        return redirect(url_for('auth.register'))

    return render_template('auth/financial_goals.html')


@auth.route('/register', methods=['GET'])
def register():
    if session.get('step') != 'register':
        return redirect(url_for('auth.financial_goals'))  # Redirect if not in sequence
    
    # Create questionaire object
    questionaire = Questionaire(
        user_id = session.get('_user_id'),  # Assuming user ID is stored in session after login
        start_withdrawal = session['questionaire']['start_withdrawal'],
        spend_funds = session['questionaire']['spend_funds'],
        knowledge = session['questionaire']['knowledge'],
        risk = session['questionaire']['risk'],
        investments = session['questionaire']['investments'],
        decision = session['questionaire']['decision'],
        portfolio = session['questionaire']['portfolio']
    )

    # Add to database
    db.session.add(questionaire)

    # Get list of financial goals and add each goal to database
    for fg in session.get('financial_goals'):
        financial_goal = FinancialGoal(
            user_id = session.get('_user_id'),
            name = fg['name'],
            target_amount = fg['amount'],
            target_date = datetime.strptime(fg['date'], '%Y-%m-%d').date(),
            added_on = datetime.now()
        )
        db.session.add(financial_goal)

    db.session.commit()

    return redirect(url_for('dashboard.index'))


@auth.route("/add-financial-goal", methods=["POST"])
@login_required
def add_financial_goal():
    data = request.get_json()
    new_goal = FinancialGoal(
        user_id=current_user.id,
        name=data["name"],
        target_amount=data["target_amount"],
        target_date=datetime.strptime(data["target_date"], "%Y-%m-%d").date(),
    )

    db.session.add(new_goal)
    db.session.commit()

    return jsonify({"message": "Financial goal added successfully!", "goal": new_goal.to_dict()}), 201

    

@auth.route('/logout')
def logout():
    logout_user()
    return render_template('auth/logout.html')


