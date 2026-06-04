from pydantic import BaseModel, Field
from typing import Optional

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#(?:[0-9a-fA-F]{3}){1,2}$')
    icon: str = Field(..., min_length=1, max_length=10)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#(?:[0-9a-fA-F]{3}){1,2}$')
    icon: Optional[str] = Field(None, min_length=1, max_length=10)


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
