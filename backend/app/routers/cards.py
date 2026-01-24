from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil, os, uuid, json
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/", response_model=List[schemas.CardOut])
def get_cards(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Card).filter(models.Card.owner_id == current_user.id).all()

@router.post("/")
async def create_card(
    name: str = Form(...),
    bank_name: str = Form(...),
    card_network: str = Form(...),
    card_type: str = Form(...),
    card_number_last4: str = Form(...),
    cvv: str = Form(None),
    expiry_date: str = Form(...),
    owner_name: str = Form(...),
    limit: float = Form(...),
    statement_date: int = Form(None),
    payment_due_date: int = Form(None),
    color_theme: str = Form("gradient-1"),
    front_image: UploadFile = File(None),
    back_image: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Handle Images
    front_path = None
    if front_image:
        front_path = f"{uuid.uuid4()}.{front_image.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, front_path), "wb") as buffer:
            shutil.copyfileobj(front_image.file, buffer)
            
    back_path = None
    if back_image:
        back_path = f"{uuid.uuid4()}.{back_image.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, back_path), "wb") as buffer:
            shutil.copyfileobj(back_image.file, buffer)

    new_card = models.Card(
        owner_id=current_user.id,
        name=name,
        bank_name=bank_name,
        card_network=card_network,
        card_type=card_type,
        card_number_last4=card_number_last4,
        cvv=cvv,
        expiry_date=expiry_date,
        owner_name=owner_name,
        limit=limit,
        statement_date=statement_date,
        payment_due_date=payment_due_date,
        color_theme=color_theme,
        front_image_path=front_path,
        back_image_path=back_path
    )
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
    
    # Optional: Delete images from disk here
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}