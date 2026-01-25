from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil, os, uuid
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/", response_model=List[schemas.TransactionOut])
def get_transactions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).order_by(models.Transaction.date.desc()).all()

@router.post("/")
async def create_transaction(
    description: str = Form(...), amount: float = Form(...), type: str = Form(...),
    card_id: int = Form(None), merchant_location: str = Form(None),
    payment_mode: str = Form("online"), is_emi: bool = Form(False), emi_months: int = Form(None),
    date_str: str = Form(None), attachment: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    file_path = None
    if attachment:
        file_path = f"{uuid.uuid4()}.{attachment.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer: shutil.copyfileobj(attachment.file, buffer)

    tx_date = datetime.now()
    if date_str:
        try: tx_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except: pass

    new_tx = models.Transaction(
        owner_id=current_user.id, description=description, amount=amount, type=type,
        card_id=card_id, merchant_location=merchant_location, payment_mode=payment_mode,
        is_emi=is_emi, emi_months=emi_months, date=tx_date, attachment_path=file_path
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.put("/{tx_id}")
async def update_transaction(
    tx_id: int,
    description: str = Form(...), amount: float = Form(...), type: str = Form(...),
    card_id: int = Form(None), merchant_location: str = Form(None),
    payment_mode: str = Form("online"), is_emi: bool = Form(False), emi_months: int = Form(None),
    date_str: str = Form(None), attachment: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.owner_id == current_user.id).first()
    if not tx: raise HTTPException(status_code=404, detail="Not found")

    tx.description = description
    tx.amount = amount
    tx.type = type
    tx.card_id = card_id
    tx.merchant_location = merchant_location
    tx.payment_mode = payment_mode
    tx.is_emi = is_emi
    tx.emi_months = emi_months
    
    if date_str:
        try: tx.date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except: pass

    if attachment:
        file_path = f"{uuid.uuid4()}.{attachment.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer: shutil.copyfileobj(attachment.file, buffer)
        tx.attachment_path = file_path

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.owner_id == current_user.id).first()
    if not tx: raise HTTPException(status_code=404, detail="Not found")
    db.delete(tx)
    db.commit()
    return {"message": "Deleted"}