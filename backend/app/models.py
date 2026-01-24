from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    currency = Column(String, default="INR")
    ntfy_url = Column(String, nullable=True)
    ntfy_topic = Column(String, nullable=True)

class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # Basic Info
    name = Column(String, index=True) # e.g. "HDFC Regalia"
    bank_name = Column(String)        # e.g. "HDFC"
    card_network = Column(String)     # Visa, Mastercard, RuPay, Amex
    card_type = Column(String)        # Credit, Debit, Forex
    
    # Details (Stored as string, simple masking for display)
    card_number_last4 = Column(String) 
    cvv = Column(String, nullable=True) # Stored raw per user request (User-Hosted)
    expiry_date = Column(String) # MM/YY
    owner_name = Column(String)
    
    # Financials
    limit = Column(Float, default=0.0)
    statement_date = Column(Integer, nullable=True) # Day of month
    payment_due_date = Column(Integer, nullable=True) # Day of month
    
    # Visuals
    color_theme = Column(String, default="gradient-1") # For virtual card CSS
    front_image_path = Column(String, nullable=True)
    back_image_path = Column(String, nullable=True)

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String)
    logo_path = Column(String, nullable=True)
    joining_date = Column(DateTime)
    relieving_date = Column(DateTime, nullable=True)
    is_current = Column(Boolean, default=False)
    
    salaries = relationship("Salary", back_populates="company", cascade="all, delete-orphan")

class Salary(Base):
    __tablename__ = "salary"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    amount = Column(Float)
    month = Column(String) # "January"
    year = Column(Integer) # 2024
    attachment_path = Column(String, nullable=True) # PDF/Image
    date_added = Column(DateTime, default=datetime.now)
    
    company = relationship("Company", back_populates="salaries")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=True) # Optional link to card
    
    description = Column(String)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.now)
    merchant_location = Column(String, nullable=True) # "Where it was spent"
    
    # Types
    type = Column(String) # "expense" or "credit"
    payment_mode = Column(String, default="online") # online, swipe, cash
    
    # EMI Logic
    is_emi = Column(Boolean, default=False)
    emi_months = Column(Integer, nullable=True) # 3, 6, 9, 12...
    
    attachment_path = Column(String, nullable=True)

class Lending(Base):
    __tablename__ = "lending"
    id = Column(Integer, primary_key=True, index=True)
    person_name = Column(String, index=True)
    total_amount = Column(Float)
    lent_date = Column(DateTime, default=datetime.now)
    is_settled = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    returns = relationship("LendingReturn", back_populates="lending", cascade="all, delete-orphan")

class LendingReturn(Base):
    __tablename__ = "lending_returns"
    id = Column(Integer, primary_key=True, index=True)
    lending_id = Column(Integer, ForeignKey("lending.id"))
    amount = Column(Float)
    return_date = Column(DateTime, default=datetime.now)
    proof_image_path = Column(String, nullable=True)
    lending = relationship("Lending", back_populates="returns")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    amount = Column(Float)
    active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))