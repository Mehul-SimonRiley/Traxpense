from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[BudgetResponse])
def get_budgets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(budget_in: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = Budget(**budget_in.model_dump(), user_id=current_user.id, spent=0.0)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.get("/{id}", response_model=BudgetResponse)
def get_budget(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.put("/{id}", response_model=BudgetResponse)
def update_budget(id: int, budget_in: BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    update_data = budget_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(budget, key, value)
        
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return None
