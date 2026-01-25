from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import shutil, os, uuid
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

# ... (Keep existing GET/POST endpoints) ...

@router.put("/companies/{company_id}")
async def update_company(
    company_id: int,
    name: str = Form(...), joining_date: str = Form(...), relieving_date: str = Form(None),
    is_current: bool = Form(False), logo: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp: raise HTTPException(status_code=404, detail="Not found")

    comp.name = name
    comp.joining_date = datetime.fromisoformat(joining_date)
    comp.relieving_date = datetime.fromisoformat(relieving_date) if relieving_date else None
    comp.is_current = is_current

    if logo:
        logo_path = f"{uuid.uuid4()}.{logo.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, logo_path), "wb") as buffer: shutil.copyfileobj(logo.file, buffer)
        comp.logo_path = logo_path
    
    db.commit()
    db.refresh(comp)
    return comp

@router.delete("/companies/{company_id}")
def delete_company(company_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp: raise HTTPException(status_code=404, detail="Not found")
    db.delete(comp)
    db.commit()
    return {"message": "Deleted"}