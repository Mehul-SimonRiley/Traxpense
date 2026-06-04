from pydantic import BaseModel, Field
from typing import Optional, Literal
import datetime as dt
from app.schemas.category import CategoryResponse

class TransactionBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=200)
    date: dt.date
    type: Literal["income", "expense"]

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[dt.date] = None
    type: Optional[Literal["income", "expense"]] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: dt.datetime
    updated_at: dt.datetime
    
    class Config:
        from_attributes = True

