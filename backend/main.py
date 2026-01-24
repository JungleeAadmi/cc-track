from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine
from backend import models
from backend.routers import auth, cards, notifications

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CC-Track API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
)

app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(notifications.router)


@app.get("/")
def health():
    return {"status": "ok"}
