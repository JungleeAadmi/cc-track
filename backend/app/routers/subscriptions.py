from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.SubscriptionOut])
def get_subs(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Subscription).filter(models.Subscription.owner_id == current_user.id).all()

@router.post("/", response_model=schemas.SubscriptionOut)
def create_sub(
    sub: schemas.SubscriptionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    new_sub = models.Subscription(**sub.dict(), owner_id=current_user.id)
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.delete("/{sub_id}")
def delete_sub(
    sub_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"message": "Deleted"}