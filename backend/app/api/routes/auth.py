from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, LoginRequest, AuthResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.dependencies import get_current_user
from datetime import timedelta

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        phone=user_in.phone,
        bio=user_in.bio,
        date_of_birth=user_in.date_of_birth,
        occupation=user_in.occupation,
        location=user_in.location,
        profile_picture=user_in.profile_picture
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token(subject=db_user.id)
    refresh_token = create_access_token(subject=db_user.id, expires_delta=timedelta(days=30))
    
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=db_user)

@router.post("/login", response_model=AuthResponse)
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_access_token(subject=user.id, expires_delta=timedelta(days=30))
    
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=user)

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

from pydantic import BaseModel
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from app.core.config import settings
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(request.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None: raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if user is None: raise credentials_exception
    return {"access_token": create_access_token(subject=user.id)}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}
