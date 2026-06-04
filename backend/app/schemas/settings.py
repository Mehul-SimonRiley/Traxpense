from pydantic import BaseModel
from typing import Optional, Dict, Any

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
