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
    card_count = db.query(models.Card).filter(models.Card.owner_id == current_user.id).count() or 0
    tx_count = db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).count() or 0
    
    active_lending = db.query(models.Lending).filter(
        models.Lending.owner_id == current_user.id,
        models.Lending.is_settled == False
    ).count() or 0
    
    lendings = db.query(models.Lending).filter(models.Lending.owner_id == current_user.id, models.Lending.is_settled == False).all()
    pending_total = 0.0
    if lendings:
        for l in lendings:
            returned = sum(r.amount for r in l.returns)
            pending_total += (l.total_amount - returned)
        
    subs = db.query(models.Subscription).filter(models.Subscription.owner_id == current_user.id, models.Subscription.active == True).all()
    monthly_subs = sum(s.amount for s in subs) if subs else 0.0
    
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