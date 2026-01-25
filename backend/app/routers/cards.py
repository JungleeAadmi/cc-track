from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil, os, uuid
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/", response_model=List[schemas.CardOut])
def get_cards(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Eager load statements
    return db.query(models.Card).filter(models.Card.owner_id == current_user.id).all()

@router.post("/")
async def create_card(
    name: str = Form(...), bank_name: str = Form(...), card_network: str = Form(...),
    card_type: str = Form(...), card_number: str = Form(...), cvv: str = Form(None),
    expiry_date: str = Form(...), owner_name: str = Form(...), limit: float = Form(...),
    statement_date: int = Form(None), payment_due_date: int = Form(None),
    color_theme: str = Form("gradient-1"), front_image: UploadFile = File(None),
    back_image: UploadFile = File(None), current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    last4 = card_number[-4:] if len(card_number) >= 4 else card_number
    front_path = None
    if front_image:
        front_path = f"{uuid.uuid4()}.{front_image.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, front_path), "wb") as buffer: shutil.copyfileobj(front_image.file, buffer)
    back_path = None
    if back_image:
        back_path = f"{uuid.uuid4()}.{back_image.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, back_path), "wb") as buffer: shutil.copyfileobj(back_image.file, buffer)

    new_card = models.Card(
        owner_id=current_user.id, name=name, bank_name=bank_name, card_network=card_network,
        card_type=card_type, card_number=card_number, card_number_last4=last4, cvv=cvv,
        expiry_date=expiry_date, owner_name=owner_name, limit=limit, statement_date=statement_date,
        payment_due_date=payment_due_date, color_theme=color_theme, front_image_path=front_path, back_image_path=back_path
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.put("/{card_id}")
async def update_card(
    card_id: int,
    name: str = Form(...), bank_name: str = Form(...), card_network: str = Form(...),
    card_type: str = Form(...), card_number: str = Form(...), cvv: str = Form(None),
    expiry_date: str = Form(...), owner_name: str = Form(...), limit: float = Form(...),
    statement_date: int = Form(None), payment_due_date: int = Form(None),
    color_theme: str = Form("gradient-1"),
    front_image: UploadFile = File(None), back_image: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card: raise HTTPException(status_code=404, detail="Card not found")

    card.name = name
    card.bank_name = bank_name
    card.card_network = card_network
    card.card_type = card_type
    card.card_number = card_number
    card.card_number_last4 = card_number[-4:] if len(card_number) >= 4 else card_number
    card.cvv = cvv
    card.expiry_date = expiry_date
    card.owner_name = owner_name
    card.limit = limit
    card.statement_date = statement_date
    card.payment_due_date = payment_due_date
    card.color_theme = color_theme

    if front_image:
        front_path = f"{uuid.uuid4()}.{front_image.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, front_path), "wb") as buffer: shutil.copyfileobj(front_image.file, buffer)
        card.front_image_path = front_path
    
    if back_image:
        back_path = f"{uuid.uuid4()}.{back_image.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, back_path), "wb") as buffer: shutil.copyfileobj(back_image.file, buffer)
        card.back_image_path = back_path

    db.commit()
    db.refresh(card)
    return card

@router.delete("/{card_id}")
def delete_card(card_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card: raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}

@router.post("/{card_id}/statements")
async def add_statement(card_id: int, month: str = Form(...), generated_date: str = Form(...), due_date: str = Form(...), total_due: float = Form(...), min_due: float = Form(0.0), attachment: UploadFile = File(None), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id, models.Card.owner_id == current_user.id).first()
    if not card: raise HTTPException(status_code=404, detail="Card not found")
    file_path = None
    if attachment:
        file_path = f"{uuid.uuid4()}.{attachment.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer: shutil.copyfileobj(attachment.file, buffer)
    stmt = models.CardStatement(card_id=card.id, month=month, generated_date=datetime.fromisoformat(generated_date), due_date=datetime.fromisoformat(due_date), total_due=total_due, min_due=min_due, attachment_path=file_path)
    db.add(stmt)
    db.commit()
    return {"message": "Statement added"}

@router.post("/statements/{stmt_id}/pay")
def pay_statement(stmt_id: int, paid_amount: float = Form(...), payment_ref: str = Form(None), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    stmt = db.query(models.CardStatement).join(models.Card).filter(models.CardStatement.id == stmt_id, models.Card.owner_id == current_user.id).first()
    if not stmt: raise HTTPException(status_code=404, detail="Statement not found")
    stmt.is_paid = True
    stmt.paid_amount = paid_amount
    stmt.payment_ref = payment_ref
    stmt.paid_date = datetime.now()
    db.commit()
    return {"message": "Payment recorded"}

@router.delete("/statements/{stmt_id}")
def delete_statement(stmt_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    stmt = db.query(models.CardStatement).join(models.Card).filter(models.CardStatement.id == stmt_id, models.Card.owner_id == current_user.id).first()
    if not stmt: raise HTTPException(status_code=404, detail="Statement not found")
    db.delete(stmt)
    db.commit()
    return {"message": "Statement deleted"}