from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/", response_model=list[schemas.CardOut])
def list_cards(db: Session = Depends(get_db)):
    return db.query(models.Card).all()
