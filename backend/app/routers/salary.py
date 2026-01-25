from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import shutil, os, uuid
from .. import database, models, schemas, auth

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/companies", response_model=List[schemas.CompanyOut])
def get_companies(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    comps = db.query(models.Company).filter(models.Company.owner_id == current_user.id).order_by(models.Company.joining_date.desc()).all()
    results = []
    for c in comps:
        total = sum(s.amount for s in c.salaries)
        c_dict = c.__dict__.copy()
        c_dict['total_earned'] = total
        results.append(c_dict)
    return results

@router.post("/companies")
async def add_company(
    name: str = Form(...), joining_date: str = Form(...), relieving_date: str = Form(None),
    is_current: bool = Form(False), logo: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    logo_path = None
    if logo:
        logo_path = f"{uuid.uuid4()}.{logo.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, logo_path), "wb") as buffer: shutil.copyfileobj(logo.file, buffer)
    j_date = datetime.fromisoformat(joining_date)
    r_date = datetime.fromisoformat(relieving_date) if relieving_date else None
    new_comp = models.Company(
        owner_id=current_user.id, name=name, joining_date=j_date, relieving_date=r_date,
        is_current=is_current, logo_path=logo_path
    )
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)
    c_dict = new_comp.__dict__.copy()
    c_dict['total_earned'] = 0.0
    return c_dict

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
    total = sum(s.amount for s in comp.salaries)
    c_dict = comp.__dict__.copy()
    c_dict['total_earned'] = total
    return c_dict

@router.delete("/companies/{company_id}")
def delete_company(company_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp: raise HTTPException(status_code=404, detail="Not found")
    db.delete(comp)
    db.commit()
    return {"message": "Deleted"}

@router.get("/slips/{company_id}", response_model=List[schemas.SalaryOut])
def get_salaries(company_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    return db.query(models.Salary).filter(models.Salary.company_id == company_id).order_by(models.Salary.date_added.desc()).all()

@router.post("/slips")
async def add_salary(
    company_id: int = Form(...), amount: float = Form(...), month: str = Form(...), year: int = Form(...),
    slip: UploadFile = File(None), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp: raise HTTPException(status_code=404, detail="Company not found")

    file_path = None
    if slip:
        file_path = f"{uuid.uuid4()}.{slip.filename.split('.')[-1]}"
        with open(os.path.join(UPLOAD_DIR, file_path), "wb") as buffer: shutil.copyfileobj(slip.file, buffer)

    new_salary = models.Salary(owner_id=current_user.id, company_id=company_id, amount=amount, month=month, year=year, attachment_path=file_path)
    db.add(new_salary)
    db.commit()
    db.refresh(new_salary)
    return new_salary

@router.delete("/slips/{slip_id}")
def delete_slip(slip_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    slip = db.query(models.Salary).filter(models.Salary.id == slip_id, models.Salary.owner_id == current_user.id).first()
    if not slip: raise HTTPException(status_code=404, detail="Slip not found")
    db.delete(slip)
    db.commit()
    return {"message": "Deleted"}