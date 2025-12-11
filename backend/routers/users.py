from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database
import requests

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if user_update.full_name:
        current_user.full_name = user_update.full_name
    if user_update.currency:
        current_user.currency = user_update.currency
    if user_update.ntfy_topic:
        current_user.ntfy_topic = user_update.ntfy_topic
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/test-notify")
def test_notification(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.ntfy_topic:
        raise HTTPException(status_code=400, detail="No Ntfy Topic set in settings")
    
    try:
        requests.post(
            f"https://ntfy.sh/{current_user.ntfy_topic}",
            data="This is a test alert from CC-Track. Notifications are working!",
            headers={
                "Title": "Test Notification",
                "Tags": "tada,check_mark"
            }
        )
        return {"message": "Test sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/me")
def delete_user(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}