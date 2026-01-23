from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    currency = Column(String, default="USD")
    
    ntfy_topic = Column(String, nullable=True)
    ntfy_server = Column(String, default="https://ntfy.sh")
    
    # Notification Preferences
    notify_card_add = Column(Boolean, default=True)
    notify_txn_add = Column(Boolean, default=True)
    notify_card_del = Column(Boolean, default=True)
    notify_statement = Column(Boolean, default=True)
    notify_due_dates = Column(Boolean, default=True)
    notify_payment_done = Column(Boolean, default=True)
    
    # Relationships
    cards = relationship("Card", back_populates="owner", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="owner", cascade="all, delete-orphan")
    lending = relationship("Lending", back_populates="owner", cascade="all, delete-orphan")
    companies = relationship("Company", back_populates="owner", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="owner", cascade="all, delete-orphan")

class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) 
    bank = Column(String) 
    network = Column(String) 
    last_4 = Column(String, nullable=True)
    card_holder = Column(String, nullable=True)
    full_number = Column(String, nullable=True)
    cvv = Column(String, nullable=True)
    valid_thru = Column(String, nullable=True)
    card_type = Column(String, default="Credit Card")
    expiry_date = Column(String, nullable=True)
    image_front = Column(Text, nullable=True)
    image_back = Column(Text, nullable=True)
    total_limit = Column(Float, default=0.0)
    manual_limit = Column(Float, nullable=True) 
    statement_date = Column(Integer) 
    payment_due_date = Column(Integer) 
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="cards")
    transactions = relationship("Transaction", back_populates="card", cascade="all, delete-orphan")
    statements = relationship("Statement", back_populates="card", cascade="all, delete-orphan")

class Statement(Base):
    __tablename__ = "statements"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float)
    is_paid = Column(Boolean, default=False)
    payment_date = Column(DateTime, nullable=True)
    card_id = Column(Integer, ForeignKey("cards.id"))
    card = relationship("Card", back_populates="statements")

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    color = Column(String, default="#3B82F6") 
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="tags")
    transactions = relationship("Transaction", back_populates="tag")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String)
    amount = Column(Float)
    type = Column(String)
    mode = Column(String, default="Online")
    is_emi = Column(Boolean, default=False)
    emi_tenure = Column(Integer, nullable=True)
    card_id = Column(Integer, ForeignKey("cards.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True)
    
    card = relationship("Card", back_populates="transactions")
    tag = relationship("Tag", back_populates="transactions")

class Lending(Base):
    __tablename__ = "lending"
    id = Column(Integer, primary_key=True, index=True)
    borrower_name = Column(String)
    amount = Column(Float)
    lent_date = Column(DateTime)
    reminder_date = Column(DateTime, nullable=True)
    attachment_lent = Column(Text, nullable=True)
    is_returned = Column(Boolean, default=False)
    returned_date = Column(DateTime, nullable=True)
    attachment_returned = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="lending")
    returns = relationship("LendingReturn", back_populates="lending", cascade="all, delete-orphan")

class LendingReturn(Base):
    __tablename__ = "lending_returns"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    attachment = Column(Text, nullable=True)
    lending_id = Column(Integer, ForeignKey("lending.id"))
    
    lending = relationship("Lending", back_populates="returns")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    joining_date = Column(DateTime)
    leaving_date = Column(DateTime, nullable=True)
    is_current = Column(Boolean, default=True)
    logo = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="companies")
    salaries = relationship("Salary", back_populates="company", cascade="all, delete-orphan")

class Salary(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    date = Column(DateTime)
    slip = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    company = relationship("Company", back_populates="salaries")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    amount = Column(Float)
    billing_cycle = Column(String)
    next_due_date = Column(DateTime)
    attachment = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="subscriptions")