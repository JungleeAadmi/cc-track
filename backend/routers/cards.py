from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.post("/", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_card = models.Card(**card.dict(), owner_id=current_user.id)
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.get("/", response_model=List[schemas.Card])
def read_cards(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    cards = db.query(models.Card).filter(models.Card.owner_id == current_user.id).offset(skip).limit(limit).all()
    return cards