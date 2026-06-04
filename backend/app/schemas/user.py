from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    date_of_birth: Optional[date] = None
    occupation: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    profile_picture: Optional[str] = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    date_of_birth: Optional[date] = None
    occupation: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    profile_picture: Optional[str] = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

class UserResponse(UserBase):
    id: int
    is_email_verified: Optional[bool] = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str
