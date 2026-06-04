from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.settings import Settings
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.settings import ProfileUpdateSchema, SecurityUpdateSchema, PreferencesUpdateSchema, NotificationsUpdateSchema
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.get("")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    # Merge user data
    result = {c.name: getattr(settings, c.name) for c in settings.__table__.columns}
    result["name"] = current_user.name
    result["email"] = current_user.email
    result["phone"] = current_user.phone
    return result

@router.put("/profile")
def update_profile(profile_in: ProfileUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
    
    # Update User Fields if provided
    if profile_in.name is not None: current_user.name = profile_in.name
    if profile_in.email is not None:
        existing_user = db.query(User).filter(User.email == profile_in.email, User.id != current_user.id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
        current_user.email = profile_in.email
    if profile_in.phone is not None: current_user.phone = profile_in.phone
    
    # Update Settings Fields
    if profile_in.bio is not None: settings.bio = profile_in.bio
    if profile_in.date_of_birth is not None: settings.date_of_birth = profile_in.date_of_birth
    if profile_in.occupation is not None: settings.occupation = profile_in.occupation
    if profile_in.location is not None: settings.location = profile_in.location
    
    db.commit()
    return {"message": "Profile updated successfully"}

@router.put("/security")
def update_security(security_in: SecurityUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
    
    if security_in.two_factor_enabled is not None: settings.two_factor_enabled = security_in.two_factor_enabled
    if security_in.login_notifications is not None: settings.login_notifications = security_in.login_notifications
    if security_in.session_timeout is not None: settings.session_timeout = security_in.session_timeout
    
    # Handle password changes
    if security_in.new_password is not None and security_in.new_password.strip():
        if not security_in.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to change password")
        if not verify_password(security_in.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        current_user.password_hash = get_password_hash(security_in.new_password)
        
    db.commit()
    return {"message": "Security updated successfully"}

@router.put("/preferences")
def update_preferences(preferences_in: PreferencesUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
        
    if preferences_in.language is not None: settings.language = preferences_in.language
    if preferences_in.date_format is not None: settings.date_format = preferences_in.date_format
    if preferences_in.time_format is not None: settings.time_format = preferences_in.time_format
    if preferences_in.timezone is not None: settings.timezone = preferences_in.timezone
    
    db.commit()
    return {"message": "Preferences updated successfully"}

@router.put("/notifications")
def update_notifications(notifications_in: NotificationsUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
        
    if notifications_in.email_notifications is not None: settings.email_notifications = notifications_in.email_notifications
    if notifications_in.push_notifications is not None: settings.push_notifications = notifications_in.push_notifications
    if notifications_in.notification_frequency is not None: settings.notification_frequency = notifications_in.notification_frequency
    if notifications_in.quiet_hours is not None: settings.quiet_hours = notifications_in.quiet_hours
    
    db.commit()
    return {"message": "Notifications updated successfully"}

