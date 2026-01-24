from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from backend import models, schemas
from backend.database import get_db
from backend.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/config", response_model=schemas.NtfyConfigOut)
def get_config(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    cfg = db.query(models.NtfyConfig).filter(
        models.NtfyConfig.user_id == user.id
    ).first()

    if not cfg:
        raise HTTPException(status_code=404, detail="Not configured")

    return cfg


@router.post("/config", response_model=schemas.NtfyConfigOut)
def save_config(
    payload: schemas.NtfyConfigCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    cfg = db.query(models.NtfyConfig).filter(
        models.NtfyConfig.user_id == user.id
    ).first()

    if cfg:
        cfg.server_url = payload.server_url
        cfg.topic = payload.topic
    else:
        cfg = models.NtfyConfig(
            user_id=user.id,
            server_url=payload.server_url,
            topic=payload.topic,
        )
        db.add(cfg)

    db.commit()
    db.refresh(cfg)
    return cfg


@router.post("/test")
def test_notification(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    cfg = db.query(models.NtfyConfig).filter(
        models.NtfyConfig.user_id == user.id
    ).first()

    if not cfg:
        raise HTTPException(status_code=400, detail="ntfy not configured")

    url = f"{cfg.server_url.rstrip('/')}/{cfg.topic}"

    try:
        r = requests.post(
            url,
            data="Test notification from CC-Track",
            headers={"Title": "CC-Track Test"},
            timeout=5,
        )
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "sent"}
