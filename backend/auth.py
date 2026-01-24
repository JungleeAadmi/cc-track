from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.auth import hash_password, verify_password, create_token
from backend.schemas import Token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token)
def signup(username: str, password: str, db: Session = Depends(get_db)):
    user = User(username=username, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    return {"access_token": create_token(user.id)}


@router.post("/login", response_model=Token)
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=username).first()
    if not user or not verify_password(password, user.password_hash):
        raise Exception("Invalid")
    return {"access_token": create_token(user.id)}
