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
    # Cards Count
    card_count = db.query(models.Card).filter(models.Card.owner_id == current_user.id).count()
    
    # Transaction Count
    tx_count = db.query(models.Transaction).filter(models.Transaction.owner_id == current_user.id).count()
    
    # Active Lending Count (Not fully settled)
    active_lending = db.query(models.Lending).filter(
        models.Lending.owner_id == current_user.id,
        models.Lending.is_settled == False
    ).count()
    
    # Pending Lending Amount
    # Sum of (Total - Returned) for all unsettled lendings
    lendings = db.query(models.Lending).filter(models.Lending.owner_id == current_user.id, models.Lending.is_settled == False).all()
    pending_total = 0
    for l in lendings:
        returned = sum(r.amount for r in l.returns)
        pending_total += (l.total_amount - returned)
        
    # Subscription Total
    subs = db.query(models.Subscription).filter(models.Subscription.owner_id == current_user.id, models.Subscription.active == True).all()
    monthly_subs = sum(s.amount for s in subs)
    
    # Last Salary
    last_salary_entry = db.query(models.Salary).filter(models.Salary.owner_id == current_user.id).order_by(models.Salary.date.desc()).first()
    last_salary = last_salary_entry.amount if last_salary_entry else 0.0

    return {
        "card_count": card_count,
        "transaction_count": tx_count,
        "active_lending_count": active_lending,
        "pending_lending_amount": pending_total,
        "monthly_subs": monthly_subs,
        "last_salary": last_salary
    }