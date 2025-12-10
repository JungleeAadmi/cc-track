from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, auth, database

router = APIRouter(prefix="/users", tags=["Users"])

@router.put("/me", response_model=schemas.User)
def update_user(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_update.full_name:
        current_user.full_name = user_update.full_name
    if user_update.currency:
        current_user.currency = user_update.currency
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
def delete_user(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}