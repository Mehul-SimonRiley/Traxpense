from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Dict, Any
from datetime import date

class ProfileUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    date_of_birth: Optional[date] = None
    occupation: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

class SecurityUpdateSchema(BaseModel):
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6, max_length=72)
    two_factor_enabled: Optional[bool] = None
    login_notifications: Optional[bool] = None
    session_timeout: Optional[int] = Field(None, ge=1, le=1440)

class PreferencesUpdateSchema(BaseModel):
    language: Optional[str] = Field(None, min_length=2, max_length=10)
    date_format: Optional[str] = Field(None, min_length=5, max_length=20)
    time_format: Optional[str] = Field(None, min_length=2, max_length=5)
    timezone: Optional[str] = Field(None, min_length=3, max_length=50)

class NotificationsUpdateSchema(BaseModel):
    email_notifications: Optional[Dict[str, bool]] = None
    push_notifications: Optional[Dict[str, bool]] = None
    notification_frequency: Optional[str] = Field(None, min_length=3, max_length=20)
    quiet_hours: Optional[Dict[str, Any]] = None

class SettingsUpdate(BaseModel):
    bio: Optional[str] = None
    date_of_birth: Optional[str] = None
    occupation: Optional[str] = None
    location: Optional[str] = None
    profile_picture: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    login_notifications: Optional[bool] = None
    session_timeout: Optional[int] = None
    language: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    timezone: Optional[str] = None
    primary_currency: Optional[str] = None
    currency_display: Optional[str] = None
    decimal_separator: Optional[str] = None
    thousands_separator: Optional[str] = None
    decimal_places: Optional[int] = None
    show_currency_symbol: Optional[bool] = None
    email_notifications: Optional[Dict[str, Any]] = None
    push_notifications: Optional[Dict[str, Any]] = None
    notification_frequency: Optional[str] = None
    quiet_hours: Optional[Dict[str, Any]] = None


class SettingsResponse(SettingsUpdate):
    id: int
    user_id: int
    
    # User Profile Fields merged from User model
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True
