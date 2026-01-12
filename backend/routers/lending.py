from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
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
    return db.query(models.Lending).filter(
        models.Lending.owner_id == current_user.id
    ).order_by(desc(models.Lending.lent_date)).all()

@router.put("/{lending_id}/return", response_model=schemas.Lending)
def mark_returned(
    lending_id: int,
    update: schemas.LendingUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    lend = db.query(models.Lending).filter(models.Lending.id == lending_id, models.Lending.owner_id == current_user.id).first()
    if not lend:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    lend.is_returned = update.is_returned
    lend.returned_date = update.returned_date
    lend.attachment_returned = update.attachment_returned
    
    db.commit()
    db.refresh(lend)
    
    if lend.is_returned:
        send_ntfy_alert(
            current_user,
            "Money Returned",
            f"{lend.borrower_name} returned {current_user.currency} {lend.amount}",
            tags="white_check_mark,moneybag"
        )
    return lend