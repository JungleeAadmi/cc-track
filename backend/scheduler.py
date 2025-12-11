from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import models
from database import SessionLocal
from utils import send_ntfy_alert

def daily_check_job():
    print("--- Running Daily Notification Check ---")
    db = SessionLocal()
    try:
        today = datetime.now()
        day_today = today.day
        
        users = db.query(models.User).filter(models.User.ntfy_topic.isnot(None)).all()
        
        for user in users:
            for card in user.cards:
                # 1. Statement Generated
                if user.notify_statement and card.statement_date == day_today:
                    send_ntfy_alert(
                        user, 
                        f"Statement Generated: {card.name}", 
                        f"Your statement for {card.bank} {card.name} should be generated today.",
                        tags="page_facing_up"
                    )

                # 2. Payment Due Logic (Every day if within 5 days range)
                if user.notify_due_dates:
                    # Logic: We need to find the "current relevant" due date for this month
                    # Create a date object for this month's due date
                    due_date_obj = today.replace(day=card.payment_due_date)
                    
                    # If the due date has passed for this month, ignore (or look at next month, but we want upcoming)
                    # If due date is 6th and today is 25th, due date was weeks ago.
                    # If due date is 25th and today is 20th, diff is 5 days.
                    
                    # Handle month rollover (e.g. today Jan 30, due Feb 2)
                    # Simple check: calculate difference in days
                    delta = (due_date_obj - today).days
                    
                    # If delta is negative, maybe the due date is next month?
                    if delta < 0:
                         next_month = today.month + 1 if today.month < 12 else 1
                         next_year = today.year if today.month < 12 else today.year + 1
                         due_date_obj = due_date_obj.replace(month=next_month, year=next_year)
                         delta = (due_date_obj - today).days

                    # Alert if due in 0 to 5 days
                    if 0 <= delta <= 5:
                         priority = "urgent" if delta <= 1 else "high"
                         msg = "due TODAY" if delta == 0 else f"due in {delta} days"
                         send_ntfy_alert(
                            user, 
                            f"Payment Due: {card.name}", 
                            f"Reminder: Payment is {msg} ({due_date_obj.strftime('%b %d')}).",
                            priority=priority,
                            tags="rotating_light" if delta == 0 else "warning"
                        )

    except Exception as e:
        print(f"Scheduler Error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(daily_check_job, 'cron', hour=9, minute=0)
    scheduler.start()
    print("--- Scheduler Started ---")