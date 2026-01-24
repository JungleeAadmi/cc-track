from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def me(db: Session = Depends(get_db)):
    user = db.query(models.User).first()
    if not user:
        user = models.User(username="demo", password_hash="x")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
