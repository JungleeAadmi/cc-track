from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, LargeBinary
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    # Removed unused fields to prevent schema errors
    age = Column(Integer, default=0)
    gender = Column(String, default="Not Specified")

    cards = relationship("Card", back_populates="owner")
    tags = relationship("Tag", back_populates="owner")

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) 
    bank = Column(String) 
    network = Column(String) 
    last_4 = Column(String, nullable=True)
    currency = Column(String, default="USD") # NEW FIELD
    
    total_limit = Column(Float, default=0.0)
    manual_limit = Column(Float, nullable=True) 
    
    statement_date = Column(Integer) 
    payment_due_date = Column(Integer) 
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="cards")
    transactions = relationship("Transaction", back_populates="card")

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
    type = Column(String) # "DEBIT" or "CREDIT"
    
    card_id = Column(Integer, ForeignKey("cards.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True)
    
    card = relationship("Card", back_populates="transactions")
    tag = relationship("Tag", back_populates="transactions")