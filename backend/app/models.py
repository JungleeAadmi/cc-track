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
    name = Column(String, index=True)
    bank_name = Column(String)
    card_network = Column(String)
    card_type = Column(String)
    card_number = Column(String) 
    card_number_last4 = Column(String)
    cvv = Column(String, nullable=True)
    expiry_date = Column(String)
    owner_name = Column(String)
    limit = Column(Float, default=0.0)
    statement_date = Column(Integer, nullable=True)
    payment_due_date = Column(Integer, nullable=True)
    color_theme = Column(String, default="gradient-1")
    front_image_path = Column(String, nullable=True)
    back_image_path = Column(String, nullable=True)
    statements = relationship("CardStatement", back_populates="card", cascade="all, delete-orphan")

class CardStatement(Base):
    __tablename__ = "card_statements"
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"))
    month = Column(String)
    generated_date = Column(DateTime)
    due_date = Column(DateTime)
    total_due = Column(Float)
    min_due = Column(Float, default=0.0)
    is_paid = Column(Boolean, default=False)
    paid_amount = Column(Float, default=0.0)
    paid_date = Column(DateTime, nullable=True)
    payment_ref = Column(String, nullable=True)
    attachment_path = Column(String, nullable=True) # Statement PDF
    payment_proof_path = Column(String, nullable=True) # New: Payment Screenshot
    card = relationship("Card", back_populates="statements")

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
    month = Column(String)
    year = Column(Integer)
    attachment_path = Column(String, nullable=True)
    date_added = Column(DateTime, default=datetime.now)
    company = relationship("Company", back_populates="salaries")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=True)
    description = Column(String)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.now)
    merchant_location = Column(String, nullable=True)
    type = Column(String)
    payment_mode = Column(String, default="online")
    is_emi = Column(Boolean, default=False)
    emi_months = Column(Integer, nullable=True)
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
    renewal_date = Column(DateTime, nullable=True)
    frequency = Column(String, default="Monthly")
    logo_path = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))