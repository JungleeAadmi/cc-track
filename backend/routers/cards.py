from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
import models, schemas, auth, database
from utils import send_ntfy_alert

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.post("/", response_model=schemas.Card)
def create_card(card: schemas.CardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_card = models.Card(**card.dict(), owner_id=current_user.id)
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    
    if current_user.notify_card_add:
        send_ntfy_alert(
            current_user,
            "Card Added",
            f"Successfully added {new_card.bank} - {new_card.name}",
            tags="credit_card,plus"
        )
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
    card_name = card.name
    db.delete(card)
    db.commit()
    
    if current_user.notify_card_del:
        send_ntfy_alert(current_user, "Card Deleted", f"Removed {card_name} from your wallet.", priority="low", tags="wastebasket")
    return {"message": "Card deleted"}

# --- STATEMENT LOGIC ---

@router.post("/{card_id}/statements", response_model=schemas.Statement)
def add_statement(
    card_id: int, 
    statement: schemas.StatementCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    new_stmt = models.Statement(
        date=statement.date,
        amount=statement.amount,
        card_id=card_id,
        is_paid=False
    )
    db.add(new_stmt)
    db.commit()
    db.refresh(new_stmt)
    return new_stmt

@router.get("/{card_id}/statements", response_model=List[schemas.Statement])
def get_statements(
    card_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    return db.query(models.Statement).filter(models.Statement.card_id == card_id).order_by(desc(models.Statement.date)).all()

@router.put("/{card_id}/statements/{statement_id}", response_model=schemas.Statement)
def update_statement(
    card_id: int,
    statement_id: int,
    stmt_update: schemas.StatementUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    stmt = db.query(models.Statement).join(models.Card).filter(
        models.Statement.id == statement_id,
        models.Statement.card_id == card_id,
        models.Card.owner_id == current_user.id
    ).first()
    
    if not stmt:
        raise HTTPException(status_code=404, detail="Statement not found")
        
    if stmt_update.date:
        stmt.date = stmt_update.date
    if stmt_update.amount is not None:
        stmt.amount = stmt_update.amount
    
    # Handle Payment Status Toggle
    if stmt_update.is_paid is not None:
        stmt.is_paid = stmt_update.is_paid
        if stmt.is_paid:
            stmt.payment_date = datetime.utcnow()
            
            # Notify Payment Done
            if current_user.notify_payment_done:
                send_ntfy_alert(
                    current_user,
                    "Payment Completed",
                    f"Paid {current_user.currency} {stmt.amount} for {stmt.card.name} statement.",
                    tags="white_check_mark,moneybag"
                )
        else:
            stmt.payment_date = None
        
    db.commit()
    db.refresh(stmt)
    return stmt

@router.delete("/{card_id}/statements/{statement_id}")
def delete_statement(
    card_id: int,
    statement_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    stmt = db.query(models.Statement).join(models.Card).filter(
        models.Statement.id == statement_id,
        models.Statement.card_id == card_id,
        models.Card.owner_id == current_user.id
    ).first()
    
    if not stmt:
        raise HTTPException(status_code=404, detail="Statement not found")
        
    db.delete(stmt)
    db.commit()
    return {"message": "Statement deleted"}