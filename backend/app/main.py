from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, dashboard, cards, transactions, lending, subscriptions, settings
import os

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CC-Track", version="1.0")

# CORS - Allow frontend to talk to backend
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount Uploads for viewing proofs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(cards.router, prefix="/api/cards", tags=["Cards"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(lending.router, prefix="/api/lending", tags=["Lending"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])

@app.get("/")
def read_root():
    return {"status": "CC-Track Backend Running"}