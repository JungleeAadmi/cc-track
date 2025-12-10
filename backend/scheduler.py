from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
import requests
from datetime import datetime, timedelta
import models
from database import SessionLocal

# --- CONFIG ---
# Change 'my_cc_tracker_123' to a unique topic secret to you!
NTFY_TOPIC = "cc_tracker_alerts_private" 
NTFY_URL = f"https://ntfy.sh/{NTFY_TOPIC}"

def send_notification(title, message, priority="default"):
    try:
        requests.post(
            NTFY_URL,
            data=message,
            headers={
                "Title": title,
                "Priority": priority,
                "Tags": "credit_card,money"
            },
            timeout=5
        )
    except Exception as e:
        print(f"Failed to send notification: {e}")

def check_upcoming_dues():
    """Runs once a day to check for payments due in 5 days"""
    db = SessionLocal()
    try:
        today = datetime.now().day
        # Find cards where payment due date is 5 days from now
        # Note: This is simplified logic. Real date math for "next month" is complex.
        # This assumes payment due date is a fixed day of the month (e.g., 20th).
        
        target_day = (datetime.now() + timedelta(days=5)).day
        
        cards = db.query(models.Card).filter(models.Card.payment_due_date == target_day).all()
        
        for card in cards:
            send_notification(
                title="Payment Due Soon!",
                message=f"Your {card.name} ({card.bank}) payment is due in 5 days.",
                priority="high"
            )
            
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run check every day at 10:00 AM
    scheduler.add_job(check_upcoming_dues, 'cron', hour=10, minute=0)
    scheduler.start()
    print("--- Scheduler Started (Ntfy) ---")