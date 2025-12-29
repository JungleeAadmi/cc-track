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

                # 2. Payment Due Logic
                if user.notify_due_dates:
                    # Find potential due date
                    due_date_obj = today.replace(day=card.payment_due_date)
                    
                    # Adjust if day < today (means it might be next month)
                    # But we specifically want the *current upcoming* due date
                    # If today is Jan 28 and due is 5th, the due date is Feb 5.
                    if due_date_obj < today:
                        # Move to next month
                        next_month = today.month + 1 if today.month < 12 else 1
                        next_year = today.year if today.month < 12 else today.year + 1
                        due_date_obj = due_date_obj.replace(month=next_month, year=next_year)
                    
                    delta = (due_date_obj - today).days

                    # Alert if within 5 days
                    if 0 <= delta <= 5:
                        # CRITICAL: Check if Statement is already paid
                        # We look for a statement generated this cycle (approx 20 days before due date)
                        # Simplified: Look for *any* UNPAID statement for this card
                        unpaid_stmt = db.query(models.Statement).filter(
                            models.Statement.card_id == card.id,
                            models.Statement.is_paid == False
                        ).first()

                        # If there is an unpaid statement OR no statement recorded yet (assume unpaid), warn user
                        # But if user recorded statement and marked paid, unpaid_stmt will be None.
                        
                        # Refined Logic: If NO statements exist, warn (user hasn't logged it).
                        # If Unpaid statement exists, warn.
                        # If ONLY Paid statements exist, DO NOT warn.
                        
                        has_unpaid = db.query(models.Statement).filter(
                             models.Statement.card_id == card.id,
                             models.Statement.is_paid == False
                        ).count() > 0
                        
                        # Also warn if NO statement logged yet for this month? 
                        # Let's stick to: Warn if Unpaid Statement Exists OR user wants general reminders
                        # To support "Stop if paid", we assume user MUST log statement and mark it paid.
                        
                        if has_unpaid:
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