from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class BudgetBase(BaseModel):
    category_id: int
    amount: float
    start_date: date
    end_date: date
    alert_threshold: Optional[float] = None
    alert_enabled: Optional[bool] = False

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    alert_threshold: Optional[float] = None
    alert_enabled: Optional[bool] = None

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent: Optional[float] = 0.0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
