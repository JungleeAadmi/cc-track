from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import cards, transactions, lending, subscriptions, users, notifications
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CC-Track API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(cards.router)
app.include_router(transactions.router)
app.include_router(lending.router)
app.include_router(subscriptions.router)
app.include_router(notifications.router)
