from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas, auth, database

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.post("/", response_model=schemas.Subscription)
def create_subscription(
    sub: schemas.SubscriptionCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    new_sub = models.Subscription(**sub.dict(), owner_id=current_user.id)
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.get("/", response_model=List[schemas.Subscription])
def get_subscriptions(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Subscription).filter(
        models.Subscription.owner_id == current_user.id
    ).order_by(models.Subscription.next_due_date).all()

@router.put("/{sub_id}", response_model=schemas.Subscription)
def update_subscription(
    sub_id: int,
    sub_update: schemas.SubscriptionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    for field, value in sub_update.dict(exclude_unset=True).items():
        setattr(sub, field, value)

    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/{sub_id}")
def delete_subscription(
    sub_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
    return {"message": "Deleted"}