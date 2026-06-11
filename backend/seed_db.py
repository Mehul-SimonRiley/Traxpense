import sys
import os
import datetime
import random
import bcrypt

# Add current directory to path so app can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.db.base import Base

def get_hashing_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Server connection string without db name to create database first
DB_SERVER_URL = "mysql+pymysql://root:@localhost:3306/"
DB_NAME = "traxpense"

print("Connecting to MySQL server...")
engine_server = create_engine(DB_SERVER_URL)
with engine_server.connect() as conn:
    print(f"Creating database {DB_NAME} if not exists...")
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
    conn.commit()

# Connect to the created database
DB_URL = f"{DB_SERVER_URL}{DB_NAME}"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("Creating database tables...")
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.settings import Settings

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # Check if dev_account already exists
    dev_user = db.query(User).filter(User.email == "dev_account@example.com").first()
    if dev_user:
        print("dev_account already exists. Cleaning up existing data to re-seed...")
        db.query(Budget).filter(Budget.user_id == dev_user.id).delete()
        db.query(Transaction).filter(Transaction.user_id == dev_user.id).delete()
        db.query(Category).filter(Category.user_id == dev_user.id).delete()
        db.query(Settings).filter(Settings.user_id == dev_user.id).delete()
        db.query(User).filter(User.id == dev_user.id).delete()
        db.commit()

    # Create dev user
    print("Creating dev_account user...")
    hashed_pwd = get_hashing_password("password123")
    user = User(
        name="dev_account",
        email="dev_account@example.com",
        password_hash=hashed_pwd,
        phone="9876543210",
        bio="Developer testing account",
        location="Mumbai, India",
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default settings
    print("Initializing user settings...")
    settings = Settings(
        user_id=user.id,
        bio=user.bio,
        location=user.location,
        language="en",
        date_format="YYYY-MM-DD",
        time_format="24h",
        timezone="Asia/Kolkata",
        primary_currency="INR",
        currency_display="symbol",
        show_currency_symbol=True
    )
    db.add(settings)

    # Create default categories for the user
    print("Seeding default categories...")
    categories_data = [
        {"name": "Food & Dining", "color": "#FF6B6B", "icon": "🍔"},
        {"name": "Transport", "color": "#4DABF7", "icon": "🚗"},
        {"name": "Rent & Housing", "color": "#FAB005", "icon": "🏠"},
        {"name": "Entertainment", "color": "#E64980", "icon": "🎬"},
        {"name": "Utilities", "color": "#12B886", "icon": "⚡"},
        {"name": "Shopping", "color": "#BE4BDB", "icon": "🛍️"},
        {"name": "Investments", "color": "#7950F2", "icon": "📈"},
        {"name": "Salary", "color": "#40C057", "icon": "💼"},
        {"name": "Others", "color": "#868E96", "icon": "💵"},
    ]

    categories = []
    for cat in categories_data:
        c = Category(
            user_id=user.id,
            name=cat["name"],
            color=cat["color"],
            icon=cat["icon"]
        )
        db.add(c)
        categories.append(c)
    
    db.commit()

    # Get mapped category references
    cats_by_name = {c.name: c for c in categories}

    print("Generating realistic transaction history for past 1 year...")
    # Time range: past 12 months (365 days) up to today
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=365)
    
    transactions_to_add = []

    # Loop day by day
    current_date = start_date
    while current_date <= today:
        month_day = current_date.day
        weekday = current_date.weekday() # 0 = Monday, 6 = Sunday

        # 1. Salary Income on the 1st of every month
        if month_day == 1:
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Salary"].id,
                amount=75000.0,
                description="Monthly Salary Credit",
                date=current_date,
                type="income"
            ))

        # 2. Rent on the 5th of every month
        if month_day == 5:
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Rent & Housing"].id,
                amount=22000.0,
                description="Apartment Rent Payment",
                date=current_date,
                type="expense"
            ))

        # 3. Utilities on the 10th of every month (Electricity & Internet)
        if month_day == 10:
            # Electricity
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Utilities"].id,
                amount=random.uniform(2500.0, 4500.0),
                description="Electricity Bill Payment",
                date=current_date,
                type="expense"
            ))
            # Internet
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Utilities"].id,
                amount=999.0,
                description="Broadband Internet Bill",
                date=current_date,
                type="expense"
            ))

        # 4. Investments on the 15th of every month
        if month_day == 15:
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Investments"].id,
                amount=10000.0,
                description="SIP Mutual Fund Investment",
                date=current_date,
                type="expense"
            ))

        # 5. Food & Dining: Random daily or semi-daily expenses
        # Grocery shopping on weekends (Saturday/Sunday)
        if weekday in [5, 6] and random.random() < 0.7:
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Food & Dining"].id,
                amount=random.uniform(1200.0, 2500.0),
                description="Weekend Groceries",
                date=current_date,
                type="expense"
            ))
        
        # Dinners, Coffee, Snacks during the week
        if random.random() < 0.4:
            desc = random.choice(["Swiggy Delivery", "Coffee & Croissant", "Lunch with colleagues", "Zomato Dinner", "Quick snacks"])
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Food & Dining"].id,
                amount=random.uniform(150.0, 950.0),
                description=desc,
                date=current_date,
                type="expense"
            ))

        # 6. Transport: Uber/Cab rides or Fuel
        if random.random() < 0.3:
            desc = random.choice(["Uber Cab Ride", "Auto fare", "Petrol Refill", "Metro Smartcard Recharge"])
            amount = random.uniform(80.0, 350.0) if "Petrol" not in desc else random.uniform(1000.0, 1500.0)
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Transport"].id,
                amount=amount,
                description=desc,
                date=current_date,
                type="expense"
            ))

        # 7. Entertainment: Movies, concerts, subscriptions on weekends or mid-month
        if weekday == 4 and random.random() < 0.4: # Friday nights
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Entertainment"].id,
                amount=random.uniform(500.0, 1800.0),
                description="Movie Tickets & Popcorn",
                date=current_date,
                type="expense"
            ))
        # Netflix subscription on the 18th of every month
        if month_day == 18:
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Entertainment"].id,
                amount=649.0,
                description="Netflix Premium Subscription",
                date=current_date,
                type="expense"
            ))

        # 8. Shopping: Clothing, Electronics, Home decor (occasional)
        if random.random() < 0.08:
            desc = random.choice(["Amazon Purchase", "Zara Clothing", "Nike Shoes", "Household items", "Gifts"])
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Shopping"].id,
                amount=random.uniform(1000.0, 7500.0),
                description=desc,
                date=current_date,
                type="expense"
            ))

        # 9. Others / Miscellaneous expenses
        if random.random() < 0.05:
            transactions_to_add.append(Transaction(
                user_id=user.id,
                category_id=cats_by_name["Others"].id,
                amount=random.uniform(50.0, 500.0),
                description="Laundry / Dry Cleaning" if random.random() < 0.5 else "Miscellaneous cash spending",
                date=current_date,
                type="expense"
            ))

        current_date += datetime.timedelta(days=1)

    print(f"Bulk inserting {len(transactions_to_add)} transactions...")
    db.bulk_save_objects(transactions_to_add)
    db.commit()

    # Set up budgets for the current month
    print("Setting up budgets for the current month...")
    current_month_start = datetime.date(today.getFullYear() if hasattr(today, 'getFullYear') else today.year, today.month, 1)
    # Get last day of month
    if today.month == 12:
        next_month = datetime.date(today.year + 1, 1, 1)
    else:
        next_month = datetime.date(today.year, today.month + 1, 1)
    current_month_end = next_month - datetime.timedelta(days=1)

    budgets_to_add = [
        Budget(
            user_id=user.id,
            category_id=cats_by_name["Food & Dining"].id,
            amount=15000.0,
            start_date=current_month_start,
            end_date=current_month_end,
            alert_threshold=0.8,
            alert_enabled=True,
            spent=0.0
        ),
        Budget(
            user_id=user.id,
            category_id=cats_by_name["Transport"].id,
            amount=5000.0,
            start_date=current_month_start,
            end_date=current_month_end,
            alert_threshold=0.8,
            alert_enabled=True,
            spent=0.0
        ),
        Budget(
            user_id=user.id,
            category_id=cats_by_name["Shopping"].id,
            amount=10000.0,
            start_date=current_month_start,
            end_date=current_month_end,
            alert_threshold=0.8,
            alert_enabled=True,
            spent=0.0
        ),
        Budget(
            user_id=user.id,
            category_id=cats_by_name["Entertainment"].id,
            amount=8000.0,
            start_date=current_month_start,
            end_date=current_month_end,
            alert_threshold=0.8,
            alert_enabled=True,
            spent=0.0
        )
    ]
    
    db.bulk_save_objects(budgets_to_add)
    db.commit()
    print("Database seeding completed successfully!")

except Exception as e:
    db.rollback()
    print(f"Error seeding database: {e}")
    raise
finally:
    db.close()
