from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import date, datetime

class BudgetBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0)
    start_date: date
    end_date: date
    alert_threshold: Optional[float] = Field(None, gt=0)
    alert_enabled: Optional[bool] = False

    @model_validator(mode='after')
    def validate_dates(self) -> 'BudgetBase':
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be after or equal to start_date")
        return self

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    alert_threshold: Optional[float] = Field(None, gt=0)
    alert_enabled: Optional[bool] = None

    @model_validator(mode='after')
    def validate_dates(self) -> 'BudgetUpdate':
        # If both are updated, validate they are sequential.
        # Note: we might only update one date. Since it's Pydantic model validation, we can't easily cross-reference database state
        # but we can validate if both start_date and end_date are provided in the update payload.
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be after or equal to start_date")
        return self


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent: Optional[float] = 0.0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
