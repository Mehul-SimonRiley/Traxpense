from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date, datetime
from app.schemas.category import CategoryResponse

class TransactionBase(BaseModel):
    category_id: int
    amount: float
    description: Optional[str] = None
    date: date
    type: Literal["income", "expense"]

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[date] = None
    type: Optional[Literal["income", "expense"]] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
