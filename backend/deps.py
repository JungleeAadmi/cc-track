from fastapi import Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.config import SECRET_KEY, ALGORITHM


def get_current_user(db: Session = Depends(get_db), authorization: str = ""):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401)
    token = authorization.split()[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user = db.get(User, payload["sub"])
    if not user:
        raise HTTPException(401)
    return user
