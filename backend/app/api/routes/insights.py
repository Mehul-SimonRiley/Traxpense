from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("")
def get_insights(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return {"insights": ["Your spending is on track"]}
