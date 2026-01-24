from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid
from datetime import datetime
import requests
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

# --- Helper to send Ntfy notification ---
def send_ntfy(user: models.User, title: str, message: str):
    if user.ntfy_url and user.ntfy_topic:
        try:
            requests.post(
                f"{user.ntfy_url}/{user.ntfy_topic}",
                data=message.encode(encoding='utf-8'),
                headers={"Title": title.encode(encoding='utf-8')}
            )
        except Exception as e:
            print(f"Ntfy error: {e}")

@router.get("/", response_model=List[schemas.LendingOut])
def get_lendings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    lendings = db.query(models.Lending).filter(models.Lending.owner_id == current_user.id).order_by(models.Lending.lent_date.desc()).all()
    
    # Calculate computed fields (returned & pending)
    results = []
    for l in lendings:
        returned = sum(r.amount for r in l.returns)
        pending = l.total_amount - returned
        
        # Pydantic expects a dict or object matching the schema
        # We construct a response object manually or let Pydantic handle it via ORM mode, 
        # but we need to inject the calculated fields.
        l_dict = l.__dict__.copy()
        l_dict['returned_amount'] = returned
        l_dict['pending_amount'] = pending
        l_dict['returns'] = l.returns
        results.append(l_dict)
        
    return results

@router.post("/", response_model=schemas.LendingOut)
def create_lending(
    lending: schemas.LendingCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_lending = models.Lending(**lending.dict(), owner_id=current_user.id)
    db.add(new_lending)
    db.commit()
    db.refresh(new_lending)
    
    # Return structure with 0 returned/full pending
    l_dict = new_lending.__dict__.copy()
    l_dict['returned_amount'] = 0
    l_dict['pending_amount'] = new_lending.total_amount
    return l_dict

@router.post("/{lending_id}/return", response_model=schemas.SimpleResponse)
async def add_return(
    lending_id: int,
    amount: float = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    lending = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lending:
        raise HTTPException(status_code=404, detail="Lending not found")
    
    # Save File
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create Return Entry
    new_return = models.LendingReturn(
        lending_id=lending.id,
        amount=amount,
        proof_image_path=filename
    )
    db.add(new_return)
    
    # Check if settled
    # Re-calculate total returned including this one
    current_returned = sum(r.amount for r in lending.returns) + amount
    if current_returned >= lending.total_amount:
        lending.is_settled = True
        
    db.commit()
    
    # Send Notification
    send_ntfy(current_user, "CC-Track Return", f"Received {amount} from {lending.person_name}")
    
    return {"message": "Return added successfully"}