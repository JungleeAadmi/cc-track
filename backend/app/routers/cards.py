from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.CardOut])
def get_cards(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Card).filter(models.Card.owner_id == current_user.id).all()

@router.post("/", response_model=schemas.CardOut)
def create_card(
    card: schemas.CardCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_card = models.Card(**card.dict(), owner_id=current_user.id)
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.delete("/{card_id}")
def delete_card(
    card_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}