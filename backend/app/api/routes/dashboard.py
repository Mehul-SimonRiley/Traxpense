from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
from app.db.database import get_db
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.category import Category
from app.models.user import User
from app.api.dependencies import get_current_user
from collections import defaultdict

router = APIRouter()

@router.get("")
def get_dashboard_data(
    timeframe: Optional[str] = "all",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Filter transactions based on user and timeframe/dates
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if timeframe == "today":
        query = query.filter(Transaction.date == date.today())
    elif timeframe == "month":
        today = date.today()
        query = query.filter(Transaction.date >= date(today.year, today.month, 1))
    elif timeframe == "custom" and start_date and end_date:
        query = query.filter(Transaction.date >= start_date, Transaction.date <= end_date)
        
    transactions = query.all()
    
    # Calculate Income, Expense, Balance, Savings
    income = sum(t.amount for t in transactions if t.type == "income")
    expenses = sum(t.amount for t in transactions if t.type == "expense")
    
    savings = income - expenses
    savings_rate = f"{int(savings / income * 100)}%" if income > 0 and savings > 0 else "0%"
    
    summary = {
        "totalExpenses": expenses,
        "totalIncome": income,
        "currentBalance": savings,
        "savings": savings,
        "expenseTrend": "0%",
        "incomeTrend": "0%",
        "balanceTrend": "0%",
        "savingsRate": savings_rate
    }
    
    # Recent Transactions List (limit 5) with category names
    recent_transactions_query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(5).all()
    
    recent_transactions = []
    for t in recent_transactions_query:
        recent_transactions.append({
            "id": t.id,
            "category_id": t.category_id,
            "category": t.category.name if t.category else "Uncategorized",
            "amount": t.amount,
            "description": t.description or "",
            "date": t.date.isoformat(),
            "type": t.type
        })
        
    # Category breakdown (for the filtered transactions)
    breakdown_dict = {}
    for t in transactions:
        if t.type == "expense" and t.category:
            cat_name = t.category.name
            cat_color = t.category.color
            if cat_name not in breakdown_dict:
                breakdown_dict[cat_name] = {
                    "category": cat_name, 
                    "name": cat_name, 
                    "amount": 0.0, 
                    "color": cat_color
                }
            breakdown_dict[cat_name]["amount"] += t.amount
            
    category_breakdown = list(breakdown_dict.values())
    
    # Budget status
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    budget_status = []
    for b in budgets:
        spent_sum = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category_id == b.category_id,
            Transaction.type == "expense",
            Transaction.date >= b.start_date,
            Transaction.date <= b.end_date
        ).scalar() or 0.0
        
        budget_status.append({
            "id": b.id,
            "category": b.category.name if b.category else "Uncategorized",
            "budget": b.amount,
            "spent": float(spent_sum),
            "percent": float(spent_sum / b.amount * 100) if b.amount > 0 else 0.0
        })
        
    # Last 6 months Trends
    monthly_income = defaultdict(float)
    monthly_expense = defaultdict(float)
    
    all_transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    for t in all_transactions:
        month_key = t.date.strftime("%Y-%m")
        if t.type == "income":
            monthly_income[month_key] += t.amount
        else:
            monthly_expense[month_key] += t.amount
            
    all_months = sorted(list(set(list(monthly_income.keys()) + list(monthly_expense.keys()))))[-6:]
    if not all_months:
        all_months = [date.today().strftime("%Y-%m")]
        
    expense_trends = []
    income_trends = []
    for m in all_months:
        expense_trends.append({
            "month": m,
            "amount": monthly_expense[m],
            "total": monthly_expense[m]
        })
        income_trends.append({
            "month": m,
            "amount": monthly_income[m],
            "total": monthly_income[m]
        })
        
    return {
        "summary": summary,
        "recentTransactions": recent_transactions,
        "categoryBreakdown": category_breakdown,
        "budgetStatus": budget_status,
        "expenseTrends": expense_trends,
        "incomeTrends": income_trends
    }

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    income = sum(t.amount for t in transactions if t.type == "income")
    expenses = sum(t.amount for t in transactions if t.type == "expense")
    return {
        "totalBalance": income - expenses,
        "income": income,
        "expenses": expenses,
        "savings": income - expenses
    }

@router.get("/recent-transactions")
def get_recent_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).limit(5).all()
