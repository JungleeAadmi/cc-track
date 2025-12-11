from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    
    for card in cards:
        debits = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.card_id == card.id, models.Transaction.type == "DEBIT").scalar() or 0.0
        credits = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.card_id == card.id, models.Transaction.type == "CREDIT").scalar() or 0.0
        
        current_balance = debits - credits
        if current_balance < 0: current_balance = 0
        
        active_limit = card.manual_limit if (card.manual_limit and card.manual_limit > 0) else card.total_limit
        
        card.spent = current_balance
        card.available = active_limit - current_balance

    return cards

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}