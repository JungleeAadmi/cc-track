from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import database, models, schemas, auth

router = APIRouter()

@router.get("/", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        # Helper to safely return 0 if count/sum is None
        def safe_count(q): return q.count() or 0
        def safe_sum(val): return val or 0.0

        card_count = safe_count(db.query(models.Card).filter(models.Card.owner_id == current_user.id))
        tx_count = safe_count(db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id))
        
        active_lending = safe_count(db.query(models.Lending).filter(
            models.Lending.owner_id == current_user.id,
            models.Lending.is_settled == False
        ))
        
        lendings = db.query(models.Lending).filter(models.Lending.owner_id == current_user.id, models.Lending.is_settled == False).all()
        pending_total = 0.0
        for l in lendings:
            returned = sum(r.amount for r in l.returns)
            pending_total += (l.total_amount - returned)
            
        subs = db.query(models.Subscription).filter(models.Subscription.owner_id == current_user.id, models.Subscription.active == True).all()
        monthly_subs = sum(s.amount for s in subs)
        
        last_salary_entry = db.query(models.Salary).filter(models.Salary.owner_id == current_user.id).order_by(models.Salary.date_added.desc()).first()
        last_salary = last_salary_entry.amount if last_salary_entry else 0.0

        return {
            "card_count": card_count,
            "transaction_count": tx_count,
            "active_lending_count": active_lending,
            "pending_lending_amount": pending_total,
            "monthly_subs": monthly_subs,
            "last_salary": last_salary
        }
    except Exception as e:
        print(f"Dashboard Error: {e}")
        # Return zeros on error to prevent crash
        return {
            "card_count": 0, "transaction_count": 0, "active_lending_count": 0,
            "pending_lending_amount": 0.0, "monthly_subs": 0.0, "last_salary": 0.0
        }