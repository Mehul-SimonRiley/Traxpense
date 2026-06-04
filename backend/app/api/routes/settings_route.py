from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.settings import Settings
from app.models.user import User
from app.api.dependencies import get_current_user

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
async def update_profile(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = await request.json()
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    
    # Update User Fields
    if "name" in data: current_user.name = data["name"]
    if "email" in data: current_user.email = data["email"]
    if "phone" in data: current_user.phone = data["phone"]
    
    # Update Settings Fields
    if "bio" in data: settings.bio = data["bio"]
    if "date_of_birth" in data: settings.date_of_birth = data["date_of_birth"]
    if "occupation" in data: settings.occupation = data["occupation"]
    if "location" in data: settings.location = data["location"]
    
    db.commit()
    return {"message": "Profile updated successfully"}

@router.put("/security")
async def update_security(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = await request.json()
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    
    if "two_factor_enabled" in data: settings.two_factor_enabled = data["two_factor_enabled"]
    if "login_notifications" in data: settings.login_notifications = data["login_notifications"]
    if "session_timeout" in data: settings.session_timeout = data["session_timeout"]
    
    # Ignoring password changes for now in this generic endpoint
    db.commit()
    return {"message": "Security updated successfully"}

@router.put("/preferences")
async def update_preferences(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = await request.json()
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    
    keys = ["language", "date_format", "time_format", "timezone"]
    for k in keys:
        if k in data: setattr(settings, k, data[k])
    db.commit()
    return {"message": "Preferences updated successfully"}

@router.put("/notifications")
async def update_notifications(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = await request.json()
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    
    keys = ["email_notifications", "push_notifications", "notification_frequency", "quiet_hours"]
    for k in keys:
        if k in data: setattr(settings, k, data[k])
    db.commit()
    return {"message": "Notifications updated successfully"}
