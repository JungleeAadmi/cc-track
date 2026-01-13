from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import models
from database import engine
from routers import auth, cards, transactions, users, lending, salary, data, subscriptions
from scheduler import start_scheduler

models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield

app = FastAPI(title="Credit Card Tracker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(lending.router, prefix="/api")
app.include_router(salary.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")

import os
if os.path.exists("../frontend/dist"):
    app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}