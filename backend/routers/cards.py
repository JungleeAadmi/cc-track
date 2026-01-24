from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Card
from backend.deps import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/")
def list_cards(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Card).filter_by(user_id=user.id).all()
