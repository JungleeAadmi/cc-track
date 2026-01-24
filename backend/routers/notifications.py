from fastapi import APIRouter, Depends
import requests
from backend.database import get_db
from backend.models import NtfyConfig
from backend.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/test")
def test_ntfy(db=Depends(get_db), user=Depends(get_current_user)):
    cfg = db.query(NtfyConfig).filter_by(user_id=user.id).first()
    if not cfg:
        return {"error": "not configured"}
    requests.post(f"{cfg.server_url}/{cfg.topic}", data="CC-Track test")
    return {"ok": True}
