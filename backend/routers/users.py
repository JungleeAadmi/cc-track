from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database
from utils import send_ntfy_alert

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Update fields if provided
    for field, value in user_update.dict(exclude_unset=True).items():
        if field == 'password':
            current_user.hashed_password = auth.get_password_hash(value)
        else:
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/test-notify")
def test_notification(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.ntfy_topic:
        raise HTTPException(status_code=400, detail="No Ntfy Topic set")
    
    send_ntfy_alert(
        current_user,
        "Test Notification",
        f"Success! Connected to {current_user.ntfy_server or 'ntfy.sh'}",
        priority="high",
        tags="tada,check_mark"
    )
    return {"message": "Test sent"}

@router.delete("/me")
def delete_user(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}