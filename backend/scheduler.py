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
            # 1. Card Alerts
            for card in user.cards:
                if user.notify_statement and card.statement_date == day_today:
                    send_ntfy_alert(user, f"Statement: {card.name}", f"Statement likely generated today.", tags="page_facing_up")

                if user.notify_due_dates:
                    due_date_obj = today.replace(day=card.payment_due_date)
                    if due_date_obj < today:
                        next_month = today.month + 1 if today.month < 12 else 1
                        next_year = today.year if today.month < 12 else today.year + 1
                        due_date_obj = due_date_obj.replace(month=next_month, year=next_year)
                    
                    delta = (due_date_obj - today).days

                    if 0 <= delta <= 5:
                        has_unpaid = db.query(models.Statement).filter(
                             models.Statement.card_id == card.id,
                             models.Statement.is_paid == False
                        ).count() > 0
                        
                        if has_unpaid:
                             priority = "urgent" if delta <= 1 else "high"
                             msg = "due TODAY" if delta == 0 else f"due in {delta} days"
                             send_ntfy_alert(user, f"Payment Due: {card.name}", f"Reminder: Payment is {msg}.", priority=priority, tags="rotating_light")

            # 2. Lending Reminders
            lending_items = db.query(models.Lending).filter(
                models.Lending.owner_id == user.id,
                models.Lending.is_returned == False
            ).all()
            
            for item in lending_items:
                if item.reminder_date and item.reminder_date.date() == today.date():
                     send_ntfy_alert(
                        user,
                        f"Lending Reminder: {item.borrower_name}",
                        f"Reminder to ask {item.borrower_name} for {user.currency} {item.amount}.",
                        priority="high",
                        tags="handshake"
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