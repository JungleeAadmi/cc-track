from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import models, schemas, auth, database
from utils import send_ntfy_alert

router = APIRouter(prefix="/lending", tags=["Lending"])

@router.post("/", response_model=schemas.Lending)
def create_lending(
    lend: schemas.LendingCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    new_lend = models.Lending(**lend.dict(), owner_id=current_user.id)
    db.add(new_lend)
    db.commit()
    db.refresh(new_lend)
    
    send_ntfy_alert(
        current_user,
        "Money Lent",
        f"Lent {current_user.currency} {lend.amount} to {lend.borrower_name}",
        tags="handshake"
    )
    return new_lend

@router.get("/", response_model=List[schemas.Lending])
def read_lending(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Eager load returns logic handled by SQLAlchemy relationships in schemas
    return db.query(models.Lending).filter(
        models.Lending.owner_id == current_user.id
    ).order_by(desc(models.Lending.lent_date)).all()

@router.put("/{lending_id}", response_model=schemas.Lending)
def update_lending(
    lending_id: int,
    update: schemas.LendingUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    lend = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lend:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    for field, value in update.dict(exclude_unset=True).items():
        setattr(lend, field, value)
    
    db.commit()
    db.refresh(lend)
    return lend

# --- Partial Returns Logic ---
@router.post("/{lending_id}/returns", response_model=schemas.LendingReturn)
def add_return(
    lending_id: int,
    ret: schemas.LendingReturnCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    lend = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lend:
        raise HTTPException(status_code=404, detail="Lending record not found")
    
    new_ret = models.LendingReturn(**ret.dict(), lending_id=lending_id)
    db.add(new_ret)
    db.commit()
    
    # Check if fully paid to update main record status
    total_returned = db.query(func.sum(models.LendingReturn.amount)).filter(models.LendingReturn.lending_id == lending_id).scalar() or 0
    
    if total_returned >= lend.amount:
        lend.is_returned = True
        lend.returned_date = ret.date 
    else:
        lend.is_returned = False
    
    db.commit()
    db.refresh(new_ret)
    
    send_ntfy_alert(
        current_user,
        "Money Returned",
        f"{lend.borrower_name} returned {current_user.currency} {ret.amount}. Pending: {max(0, lend.amount - total_returned)}",
        tags="white_check_mark,moneybag"
    )
    
    return new_ret

@router.delete("/{lending_id}")
def delete_lending(
    lending_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    lend = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lend:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(lend)
    db.commit()
    return {"message": "Deleted"}