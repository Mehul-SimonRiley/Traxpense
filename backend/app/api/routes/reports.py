from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/income-vs-expense")
def get_income_vs_expense(timeRange: Optional[str] = "month", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"income": 0, "expense": 0}

@router.get("/spending-by-category")
def get_spending_by_category(timeRange: Optional[str] = "month", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []

@router.get("/spending-trends")
def get_spending_trends(timeRange: Optional[str] = "month", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"labels": [], "datasets": []} 
