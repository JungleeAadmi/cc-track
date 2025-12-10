from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, cards

# Create DB tables automatically on start
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Credit Card Tracker")

# CORS allows your React app to talk to Python during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up the routers
app.include_router(auth.router, prefix="/api")
app.include_router(cards.router, prefix="/api")

# Serve React Static Files (Only works if you ran `npm run build` in frontend)
import os
if os.path.exists("../frontend/dist"):
    app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "CC-Tracker Backend is running"}