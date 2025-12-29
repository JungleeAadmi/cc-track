from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
import models, schemas, auth, database
from utils import send_ntfy_alert
import io
import csv

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[schemas.Transaction])
def read_transactions(
    skip: int = 0, 
    limit: int = 500, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Return transactions for cards owned by user
    return db.query(models.Transaction).join(models.Card).filter(
        models.Card.owner_id == current_user.id
    ).order_by(desc(models.Transaction.date)).offset(skip).limit(limit).all()

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
        mode=txn.mode,
        is_emi=txn.is_emi,
        emi_tenure=txn.emi_tenure,
        card_id=txn.card_id,
        tag_id=tag_id,
        date=txn.date if txn.date else datetime.utcnow()
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    if current_user.notify_txn_add:
        emoji = "money_with_wings" if txn.type == "DEBIT" else "moneybag"
        extra = f"(EMI: {txn.emi_tenure}mo)" if txn.is_emi else ""
        send_ntfy_alert(
            current_user,
            f"New {txn.type}",
            f"{card.name}: {current_user.currency} {txn.amount} at {txn.description} {extra}",
            tags=emoji
        )
        
    return new_txn

@router.put("/{txn_id}", response_model=schemas.Transaction)
def update_transaction(
    txn_id: int,
    txn_update: schemas.TransactionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify ownership via Card
    txn = db.query(models.Transaction).join(models.Card).filter(
        models.Transaction.id == txn_id,
        models.Card.owner_id == current_user.id
    ).first()
    
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    for field, value in txn_update.dict(exclude_unset=True).items():
        if field == "tag_name" and value:
             # Handle Tag update separately
             tag_clean = value.strip().title()
             existing_tag = db.query(models.Tag).filter(models.Tag.name == tag_clean, models.Tag.owner_id == current_user.id).first()
             if existing_tag:
                 txn.tag_id = existing_tag.id
             else:
                 new_tag = models.Tag(name=tag_clean, owner_id=current_user.id)
                 db.add(new_tag)
                 db.commit()
                 db.refresh(new_tag)
                 txn.tag_id = new_tag.id
        elif field != "tag_name":
            setattr(txn, field, value)
            
    db.commit()
    db.refresh(txn)
    return txn

@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    txn = db.query(models.Transaction).join(models.Card).filter(
        models.Transaction.id == txn_id,
        models.Card.owner_id == current_user.id
    ).first()
    
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(txn)
    db.commit()
    return {"message": "Transaction deleted"}

@router.get("/export")
def export_transactions(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    txns = db.query(models.Transaction).join(models.Card).filter(models.Card.owner_id == current_user.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Card", "Type", "Mode", "Description", "Amount", "Currency", "Tag", "Is EMI", "Tenure"])
    for t in txns:
        tag_name = t.tag.name if t.tag else ""
        writer.writerow([
            t.date.strftime("%d-%b-%y %H:%M:%S"),
            t.card.name,
            t.type,
            t.mode or "Online",
            t.description,
            t.amount,
            current_user.currency,
            tag_name,
            "Yes" if t.is_emi else "No",
            f"{t.emi_tenure} Months" if t.is_emi else ""
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/analytics")
def get_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    monthly_query = db.query(
        func.strftime("%Y-%m", models.Transaction.date).label("month"),
        func.sum(models.Transaction.amount).label("total")
    ).join(models.Card).filter(
        models.Card.owner_id == current_user.id,
        models.Transaction.type == "DEBIT"
    ).group_by("month").order_by("month").all()
    monthly_data = [{"name": row.month, "amount": row.total} for row in monthly_query]

    tag_query = db.query(
        models.Tag.name,
        func.sum(models.Transaction.amount).label("total")
    ).join(models.Transaction.tag).join(models.Transaction.card).filter(
        models.Card.owner_id == current_user.id,
        models.Transaction.type == "DEBIT"
    ).group_by(models.Tag.name).all()
    tag_data = [{"name": row.name, "value": row.total} for row in tag_query]
    
    untagged = db.query(func.sum(models.Transaction.amount)).join(models.Card).filter(
        models.Card.owner_id == current_user.id,
        models.Transaction.type == "DEBIT",
        models.Transaction.tag_id == None
    ).scalar() or 0
    if untagged > 0: tag_data.append({"name": "Uncategorized", "value": untagged})

    return {"monthly": monthly_data, "category": tag_data}

@router.get("/heatmap/{card_id}")
def get_heatmap(card_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Statement).join(models.Card).filter(models.Card.owner_id == current_user.id)
    if card_id != 0:
        query = query.filter(models.Statement.card_id == card_id)
    statements = query.all()
    data = {}
    for s in statements:
        year = str(s.date.year)
        month_idx = s.date.month - 1 
        if year not in data:
            data[year] = [0.0] * 12
        data[year][month_idx] += s.amount
    return data