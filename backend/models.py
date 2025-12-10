from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    hashed_password = Column(String)

class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # e.g. Amex Gold
    bank = Column(String)
    total_limit = Column(Float)
    manual_limit = Column(Float)
    statement_date = Column(Integer) # Day of month
    payment_due_date = Column(Integer) # Day of month
    owner_id = Column(Integer, ForeignKey("users.id"))