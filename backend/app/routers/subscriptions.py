from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import database, models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.SubscriptionOut])
def get_subs(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Subscription).filter(models.Subscription.owner_id == current_user.id).all()

@router.post("/", response_model=schemas.SubscriptionOut)
def create_sub(
    name: str = Form(...), amount: float = Form(...), frequency: str = Form("Monthly"), 
    renewal_date: str = Form(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    r_date = None
    if renewal_date:
        try: r_date = datetime.fromisoformat(renewal_date)
        except: pass

    new_sub = models.Subscription(owner_id=current_user.id, name=name, amount=amount, frequency=frequency, renewal_date=r_date)
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.put("/{sub_id}", response_model=schemas.SubscriptionOut)
def update_sub(
    sub_id: int, name: str = Form(...), amount: float = Form(...), frequency: str = Form(...),
    renewal_date: str = Form(None),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)
):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if not sub: raise HTTPException(status_code=404, detail="Not found")
    
    sub.name = name
    sub.amount = amount
    sub.frequency = frequency
    if renewal_date:
        try: sub.renewal_date = datetime.fromisoformat(renewal_date)
        except: pass
    
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/{sub_id}")
def delete_sub(sub_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id, models.Subscription.owner_id == current_user.id).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"message": "Deleted"}