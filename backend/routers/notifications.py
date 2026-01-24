from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from backend.database import get_db
from backend.deps import get_current_user
from backend import models, schemas

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/config", response_model=schemas.NtfyConfigOut)
def get_cfg(db: Session = Depends(get_db), user=Depends(get_current_user)):
    cfg = db.query(models.NtfyConfig).filter_by(user_id=user.id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Not configured")
    return cfg


@router.post("/test")
def test_ntfy(db: Session = Depends(get_db), user=Depends(get_current_user)):
    cfg = db.query(models.NtfyConfig).filter_by(user_id=user.id).first()
    if not cfg:
        raise HTTPException(status_code=400, detail="Not configured")

    requests.post(
        f"{cfg.server_url.rstrip('/')}/{cfg.topic}",
        data="CC-Track test",
        timeout=5,
    )
    return {"ok": True}
