from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import shutil, os, uuid
from datetime import datetime
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/", response_model=List[schemas.LendingOut])
def get_lendings(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
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
    lent_date: str = Form(None),
    proof: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    date_val = datetime.now()
    if lent_date:
        try: date_val = datetime.fromisoformat(lent_date.replace('Z', '+00:00'))
        except: pass

    new_lending = models.Lending(
        person_name=person_name,
        total_amount=total_amount,
        owner_id=current_user.id,
        lent_date=date_val
    )
    db.add(new_lending)
    db.commit()
    db.refresh(new_lending)
    
    if proof:
        file_path = f"{uuid.uuid4()}.{proof.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer: shutil.copyfileobj(proof.file, buffer)
        proof_entry = models.LendingReturn(lending_id=new_lending.id, amount=0, proof_image_path=file_path, return_date=date_val)
        db.add(proof_entry)
        db.commit()

    l_dict = new_lending.__dict__.copy()
    l_dict['returned_amount'] = 0.0
    l_dict['pending_amount'] = new_lending.total_amount
    return l_dict

@router.put("/{lending_id}")
async def update_lending(
    lending_id: int,
    person_name: str = Form(...),
    total_amount: float = Form(...),
    lent_date: str = Form(None),
    proof: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    lending = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lending: raise HTTPException(status_code=404, detail="Not found")
    
    lending.person_name = person_name
    lending.total_amount = total_amount
    if lent_date:
        try: lending.lent_date = datetime.fromisoformat(lent_date.replace('Z', '+00:00'))
        except: pass
    
    if proof:
        file_path = f"{uuid.uuid4()}.{proof.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer: shutil.copyfileobj(proof.file, buffer)
        proof_entry = models.LendingReturn(lending_id=lending.id, amount=0, proof_image_path=file_path, return_date=datetime.now())
        db.add(proof_entry)

    db.commit()
    db.refresh(lending)
    return {"message": "Updated"}

@router.post("/{lending_id}/return")
async def add_return(
    lending_id: int,
    amount: float = Form(...),
    return_date: str = Form(None),
    file: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    lending = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lending: raise HTTPException(status_code=404, detail="Lending not found")
    
    r_date = datetime.now()
    if return_date:
        try: r_date = datetime.fromisoformat(return_date.replace('Z', '+00:00'))
        except: pass

    filename = None
    if file:
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        with open(os.path.join(UPLOAD_DIR, filename), "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        
    new_return = models.LendingReturn(lending_id=lending.id, amount=amount, proof_image_path=filename, return_date=r_date)
    db.add(new_return)
    
    current_returned = sum(r.amount for r in lending.returns) + amount
    if current_returned >= lending.total_amount:
        lending.is_settled = True
    else:
        lending.is_settled = False
        
    db.commit()
    return {"message": "Return added"}

@router.delete("/{lending_id}")
def delete_lending(lending_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    lending = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lending: raise HTTPException(status_code=404, detail="Not found")
    db.delete(lending)
    db.commit()
    return {"message": "Deleted"}