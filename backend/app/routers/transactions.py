from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.TransactionOut])
def get_transactions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).order_by(models.Transaction.date.desc()).all()

@router.post("/", response_model=schemas.TransactionOut)
def create_transaction(
    tx: schemas.TransactionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_tx = models.Transaction(**tx.dict(), owner_id=current_user.id)
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx