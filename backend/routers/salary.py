from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas, auth, database
from utils import send_ntfy_alert

router = APIRouter(prefix="/income", tags=["Income"])

# --- COMPANIES ---
@router.post("/companies", response_model=schemas.Company)
def create_company(
    comp: schemas.CompanyCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    new_comp = models.Company(**comp.dict(), owner_id=current_user.id)
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)
    return new_comp

@router.get("/companies", response_model=List[schemas.Company])
def get_companies(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Company).filter(models.Company.owner_id == current_user.id).all()

@router.put("/companies/{company_id}", response_model=schemas.Company)
def update_company(
    company_id: int,
    comp_update: schemas.CompanyUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    for field, value in comp_update.dict(exclude_unset=True).items():
        setattr(comp, field, value)
        
    db.commit()
    db.refresh(comp)
    return comp

@router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comp = db.query(models.Company).filter(models.Company.id == company_id, models.Company.owner_id == current_user.id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    db.delete(comp)
    db.commit()
    return {"message": "Company deleted"}

# --- SALARIES ---
@router.post("/salary", response_model=schemas.Salary)
def add_salary(
    sal: schemas.SalaryCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify company
    comp = db.query(models.Company).filter(models.Company.id == sal.company_id, models.Company.owner_id == current_user.id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    new_sal = models.Salary(**sal.dict())
    db.add(new_sal)
    db.commit()
    db.refresh(new_sal)
    
    send_ntfy_alert(
        current_user,
        "Salary Credited",
        f"Received {current_user.currency} {sal.amount} from {comp.name}",
        tags="bank,money_with_wings"
    )
    return new_sal

@router.get("/salary", response_model=List[schemas.Salary])
def get_salaries(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Salary).join(models.Company).filter(
        models.Company.owner_id == current_user.id
    ).order_by(desc(models.Salary.date)).all()

@router.put("/salary/{salary_id}", response_model=schemas.Salary)
def update_salary(
    salary_id: int,
    sal_update: schemas.SalaryUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sal = db.query(models.Salary).join(models.Company).filter(
        models.Salary.id == salary_id,
        models.Company.owner_id == current_user.id
    ).first()
    
    if not sal:
        raise HTTPException(status_code=404, detail="Salary record not found")
        
    for field, value in sal_update.dict(exclude_unset=True).items():
        setattr(sal, field, value)
    
    db.commit()
    db.refresh(sal)
    return sal

@router.delete("/salary/{salary_id}")
def delete_salary(
    salary_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sal = db.query(models.Salary).join(models.Company).filter(
        models.Salary.id == salary_id,
        models.Company.owner_id == current_user.id
    ).first()
    
    if not sal:
        raise HTTPException(status_code=404, detail="Salary record not found")
        
    db.delete(sal)
    db.commit()
    return {"message": "Salary record deleted"}