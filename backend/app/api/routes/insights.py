from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("")
def get_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.transaction import Transaction
    from app.models.budget import Budget
    
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    expenses = [t for t in transactions if t.type == "expense"]
    income = [t for t in transactions if t.type == "income"]
    
    total_expenses = sum(t.amount for t in expenses)
    total_income = sum(t.amount for t in income)
    
    insights = []
    
    if not transactions:
        return [
            {
                "icon": "👋",
                "title": "Welcome",
                "text": "Add your first transaction to get personalized financial insights!",
                "colorClass": "text-indigo-400"
            }
        ]
        
    # Savings rate insight
    if total_income > 0:
        savings_rate = (total_income - total_expenses) / total_income
        if savings_rate > 0.2:
            insights.append({
                "icon": "💰",
                "title": "Great Savings",
                "text": f"You saved {int(savings_rate * 100)}% of your income. Keep it up!",
                "colorClass": "text-green-400"
            })
        elif savings_rate > 0:
            insights.append({
                "icon": "📈",
                "title": "On Track",
                "text": f"You saved {int(savings_rate * 100)}% of your income. Try to hit 20% next month.",
                "colorClass": "text-blue-400"
            })
        else:
            insights.append({
                "icon": "⚠️",
                "title": "Deficit Spending",
                "text": "Your expenses exceed your income. Consider reviewing category budgets.",
                "colorClass": "text-red-400"
            })
            
    # Top spending category insight
    from collections import defaultdict
    category_totals = defaultdict(float)
    for t in expenses:
        if t.category:
            category_totals[t.category.name] += t.amount
            
    if category_totals:
        top_cat = max(category_totals, key=category_totals.get)
        top_amount = category_totals[top_cat]
        insights.append({
            "icon": "🔍",
            "title": "Top Spending",
            "text": f"Your largest category is {top_cat} with a total of ${top_amount:.2f}.",
            "colorClass": "text-yellow-400"
        })
        
    if len(insights) < 2:
        insights.append({
            "icon": "💡",
            "title": "Budget Tip",
            "text": "Setting category limits helps you stay within your monthly target budget.",
            "colorClass": "text-indigo-400"
        })
        
    return insights
