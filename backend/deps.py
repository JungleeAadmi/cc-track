from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models


def get_current_user(db: Session = Depends(get_db)):
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
