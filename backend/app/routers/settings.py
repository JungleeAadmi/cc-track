from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import requests
from .. import database, models, schemas, auth

router = APIRouter()

# --- User Settings ---
@router.get("/", response_model=schemas.UserOut)
def get_settings(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/", response_model=schemas.UserOut)
def update_settings(
    settings: schemas.UserSettings,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    current_user.currency = settings.currency
    current_user.ntfy_url = settings.ntfy_url
    current_user.ntfy_topic = settings.ntfy_topic
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/test-ntfy")
def test_notification(current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.ntfy_url or not current_user.ntfy_topic:
        return {"message": "Ntfy not configured"}
    
    try:
        resp = requests.post(
            f"{current_user.ntfy_url}/{current_user.ntfy_topic}",
            data="Test notification from CC-Track".encode('utf-8'),
            headers={"Title": "CC-Track Test".encode('utf-8')}
        )
        return {"message": f"Sent, status: {resp.status_code}"}
    except Exception as e:
        return {"message": f"Failed: {str(e)}"}