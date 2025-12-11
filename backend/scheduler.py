from apscheduler.schedulers.background import BackgroundScheduler
import requests
from datetime import datetime, timedelta
import models
from database import SessionLocal

def send_ntfy(topic, title, message, priority="default", tags=None):
    if not topic: return
    try:
        headers = {"Title": title, "Priority": priority}
        if tags: headers["Tags"] = tags
        
        requests.post(
            f"https://ntfy.sh/{topic}",
            data=message,
            headers=headers,
            timeout=10
        )
    except Exception as e:
        print(f"Ntfy Error: {e}")

def daily_check_job():
    """Checks all users and cards for statement/due dates"""
    print("--- Running Daily Notification Check ---")
    db = SessionLocal()
    try:
        today = datetime.now()
        day_today = today.day
        
        # Calculate date for "5 days from now"
        # Logic: If today is 25th, in 5 days it's 30th (or 1st/2nd/3rd depending on month)
        future_date = today + timedelta(days=5)
        day_in_5_days = future_date.day

        # Get all users with notifications enabled
        users = db.query(models.User).filter(models.User.ntfy_topic.isnot(None)).all()
        
        for user in users:
            topic = user.ntfy_topic
            if not topic: continue

            for card in user.cards:
                # 1. Statement Generation Alert
                if card.statement_date == day_today:
                    send_ntfy(
                        topic, 
                        f"Statement Generated: {card.name}", 
                        f"Your statement for {card.bank} {card.name} should be generated today.",
                        priority="default",
                        tags="page_facing_up"
                    )

                # 2. Payment Due Alert (5 Days Before)
                if card.payment_due_date == day_in_5_days:
                    send_ntfy(
                        topic, 
                        f"Payment Due Soon: {card.name}", 
                        f"Reminder: Payment for {card.name} is due in 5 days ({future_date.strftime('%b %d')}).",
                        priority="high",
                        tags="warning,credit_card"
                    )

                # 3. Payment Due Today
                if card.payment_due_date == day_today:
                     send_ntfy(
                        topic, 
                        f"URGENT: Payment Due Today", 
                        f"Please pay your {card.name} bill immediately to avoid charges.",
                        priority="urgent",
                        tags="rotating_light,moneybase"
                    )

    except Exception as e:
        print(f"Scheduler Error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every day at 9:00 AM server time
    scheduler.add_job(daily_check_job, 'cron', hour=9, minute=0)
    # Also run once immediately on startup for debugging/testing (Optional - remove in prod if annoying)
    # scheduler.add_job(daily_check_job) 
    scheduler.start()
    print("--- Scheduler Started ---")