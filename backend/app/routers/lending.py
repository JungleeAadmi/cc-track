from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import shutil, os, uuid
from datetime import datetime
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/", response_model=List[schemas.LendingOut])
def get_lendings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    lendings = db.query(models.Lending).filter(models.Lending.owner_id == current_user.id).order_by(models.Lending.lent_date.desc()).all()
    
    results = []
    for l in lendings:
        returned = sum(r.amount for r in l.returns)
        pending = l.total_amount - returned
        l_dict = l.__dict__.copy()
        l_dict['returned_amount'] = returned
        l_dict['pending_amount'] = pending
        l_dict['returns'] = l.returns
        results.append(l_dict)
    return results

@router.post("/")
async def create_lending(
    person_name: str = Form(...),
    total_amount: float = Form(...),
    proof: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_lending = models.Lending(
        person_name=person_name,
        total_amount=total_amount,
        owner_id=current_user.id,
        lent_date=datetime.now()
    )
    db.add(new_lending)
    db.commit()
    db.refresh(new_lending)

    # If proof provided, add it as the "zeroth" return with 0 amount or store separately
    # For v1 simplicity, we will store it as a return entry with 0 amount to keep track of the file
    if proof:
        file_path = f"{uuid.uuid4()}.{proof.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer:
            shutil.copyfileobj(proof.file, buffer)
            
        proof_entry = models.LendingReturn(
            lending_id=new_lending.id,
            amount=0,
            proof_image_path=file_path,
            return_date=datetime.now()
        )
        db.add(proof_entry)
        db.commit()

    # Manual response construction
    l_dict = new_lending.__dict__.copy()
    l_dict['returned_amount'] = 0.0
    l_dict['pending_amount'] = new_lending.total_amount
    return l_dict

@router.post("/{lending_id}/return")
async def add_return(
    lending_id: int,
    amount: float = Form(...),
    file: UploadFile = File(None), # Made optional
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    lending = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lending:
        raise HTTPException(status_code=404, detail="Lending not found")
    
    filename = None
    if file:
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        with open(os.path.join(UPLOAD_DIR, filename), "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
    new_return = models.LendingReturn(
        lending_id=lending.id,
        amount=amount,
        proof_image_path=filename
    )
    db.add(new_return)
    
    # Check settlement
    current_returned = sum(r.amount for r in lending.returns) + amount
    if current_returned >= lending.total_amount:
        lending.is_settled = True
        
    db.commit()
    return {"message": "Return added"}