from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.api.dependencies import get_current_user
from datetime import date, timedelta, datetime
from collections import defaultdict

router = APIRouter()

@router.get("/income-vs-expense")
def get_income_vs_expense(
    timeRange: Optional[str] = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    today = date.today()
    if timeRange == "week":
        query = query.filter(Transaction.date >= today - timedelta(days=7))
    elif timeRange == "month":
        query = query.filter(Transaction.date >= today - timedelta(days=30))
    elif timeRange == "year":
        query = query.filter(Transaction.date >= today - timedelta(days=365))
        
    transactions = query.all()
    
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expenses = sum(t.amount for t in transactions if t.type == "expense")
    
    monthly_data = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for t in transactions:
        month_name = t.date.strftime("%b %Y")
        if t.type == "income":
            monthly_data[month_name]["income"] += t.amount
        else:
            monthly_data[month_name]["expenses"] += t.amount
            
    monthly_comparison = []
    sorted_months = sorted(list(monthly_data.keys()), key=lambda m: datetime.strptime(m, "%b %Y"))
    for m in sorted_months:
        inc = monthly_data[m]["income"]
        exp = monthly_data[m]["expenses"]
        monthly_comparison.append({
            "name": m,
            "income": inc,
            "expenses": exp,
            "savings": inc - exp
        })
        
    if not monthly_comparison:
        curr_month = today.strftime("%b %Y")
        monthly_comparison.append({
            "name": curr_month,
            "income": total_income,
            "expenses": total_expenses,
            "savings": total_income - total_expenses
        })
        
    net_savings = total_income - total_expenses
    savings_rate = int(net_savings / total_income * 100) if total_income > 0 and net_savings > 0 else 0
    
    return {
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "netSavings": net_savings,
        "savingsRate": savings_rate,
        "monthlyComparison": monthly_comparison
    }

@router.get("/spending-by-category")
def get_spending_by_category(
    timeRange: Optional[str] = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.type == "expense")
    today = date.today()
    if timeRange == "week":
        query = query.filter(Transaction.date >= today - timedelta(days=7))
    elif timeRange == "month":
        query = query.filter(Transaction.date >= today - timedelta(days=30))
    elif timeRange == "year":
        query = query.filter(Transaction.date >= today - timedelta(days=365))
        
    transactions = query.all()
    
    total_expenses = sum(t.amount for t in transactions)
    
    category_amounts = defaultdict(float)
    for t in transactions:
        if t.category:
            category_amounts[t.category.name] += t.amount
            
    top_categories = []
    for cat_name, amt in category_amounts.items():
        pct = int(amt / total_expenses * 100) if total_expenses > 0 else 0
        top_categories.append({
            "name": cat_name,
            "amount": amt,
            "percentage": pct
        })
        
    top_categories = sorted(top_categories, key=lambda c: c["amount"], reverse=True)
    
    return {
        "topCategories": top_categories
    }

@router.get("/spending-trends")
def get_spending_trends(
    timeRange: Optional[str] = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.type == "expense")
    today = date.today()
    if timeRange == "week":
        query = query.filter(Transaction.date >= today - timedelta(days=7))
    elif timeRange == "month":
        query = query.filter(Transaction.date >= today - timedelta(days=30))
    elif timeRange == "year":
        query = query.filter(Transaction.date >= today - timedelta(days=365))
        
    transactions = query.all()
    
    monthly_amounts = defaultdict(float)
    for t in transactions:
        m_name = t.date.strftime("%b %Y")
        monthly_amounts[m_name] += t.amount
        
    sorted_months = sorted(list(monthly_amounts.keys()), key=lambda m: datetime.strptime(m, "%b %Y"))
    
    monthly_spending = []
    prev_amt = None
    for m in sorted_months:
        amt = monthly_amounts[m]
        if prev_amt is not None and prev_amt > 0:
            change_pct = ((amt - prev_amt) / prev_amt) * 100
            change_str = f"{'+' if change_pct >= 0 else ''}{int(change_pct)}%"
        else:
            change_str = "0%"
        monthly_spending.append({
            "name": m,
            "amount": amt,
            "change": change_str
        })
        prev_amt = amt
        
    if not monthly_spending:
        monthly_spending.append({
            "name": today.strftime("%b %Y"),
            "amount": 0.0,
            "change": "0%"
        })
        
    this_month_start = date(today.year, today.month, 1)
    if today.month == 1:
        last_month_start = date(today.year - 1, 12, 1)
        last_month_end = date(today.year - 1, 12, 31)
    else:
        last_month_start = date(today.year, today.month - 1, 1)
        last_month_end = this_month_start - timedelta(days=1)
        
    this_month_expenses = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.date >= this_month_start
    ).all()
    
    last_month_expenses = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.date >= last_month_start,
        Transaction.date <= last_month_end
    ).all()
    
    this_month_cats = defaultdict(float)
    for t in this_month_expenses:
        if t.category:
            this_month_cats[t.category.name] += t.amount
            
    last_month_cats = defaultdict(float)
    for t in last_month_expenses:
        if t.category:
            last_month_cats[t.category.name] += t.amount
            
    category_trends = []
    all_cat_names = set(list(this_month_cats.keys()) + list(last_month_cats.keys()))
    for c_name in all_cat_names:
        this_val = this_month_cats[c_name]
        last_val = last_month_cats[c_name]
        if last_val > 0:
            diff_pct = ((this_val - last_val) / last_val) * 100
            diff_str = f"{'+' if diff_pct >= 0 else ''}{int(diff_pct)}%"
        else:
            diff_str = "+100%" if this_val > 0 else "0%"
            
        category_trends.append({
            "category": c_name,
            "thisMonth": this_val,
            "lastMonth": last_val,
            "change": diff_str
        })
        
    return {
        "monthlySpending": monthly_spending,
        "categoryTrends": category_trends
    }
