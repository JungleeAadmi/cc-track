from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, auth, database
from utils import send_ntfy_alert
import io
import csv

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/", response_model=schemas.Transaction)
def create_transaction(
    txn: schemas.TransactionBase, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    card = db.query(models.Card).filter(models.Card.id == txn.card_id, models.Card.owner_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    tag_id = None
    if txn.tag_name:
        tag_clean = txn.tag_name.strip().title()
        existing_tag = db.query(models.Tag).filter(models.Tag.name == tag_clean, models.Tag.owner_id == current_user.id).first()
        if existing_tag:
            tag_id = existing_tag.id
        else:
            new_tag = models.Tag(name=tag_clean, owner_id=current_user.id)
            db.add(new_tag)
            db.commit()
            db.refresh(new_tag)
            tag_id = new_tag.id

    new_txn = models.Transaction(
        description=txn.description,
        amount=txn.amount,
        type=txn.type,
        mode=txn.mode, # NEW
        card_id=txn.card_id,
        tag_id=tag_id,
        # Use provided date or default to now
        date=txn.date if txn.date else datetime.utcnow()
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    if current_user.notify_txn_add:
        emoji = "money_with_wings" if txn.type == "DEBIT" else "moneybag"
        send_ntfy_alert(
            current_user,
            f"New {txn.type}",
            f"{card.name}: {current_user.currency} {txn.amount} at {txn.description} ({txn.mode})",
            tags=emoji
        )
        
    return new_txn

@router.get("/export")
def export_transactions(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    txns = db.query(models.Transaction).join(models.Card).filter(models.Card.owner_id == current_user.id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header - Added Mode
    writer.writerow(["Date", "Card", "Type", "Mode", "Description", "Amount", "Currency", "Tag"])
    
    for t in txns:
        tag_name = t.tag.name if t.tag else ""
        writer.writerow([
            t.date.strftime("%Y-%m-%d %H:%M"),
            t.card.name,
            t.type,
            t.mode or "Online", # Handle legacy records
            t.description,
            t.amount,
            current_user.currency,
            tag_name
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{datetime.now().strftime('%Y%m%d')}.csv"}
    )