from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
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
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.now)
    type = Column(String) # "expense" or "credit"
    owner_id = Column(Integer, ForeignKey("users.id"))

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

class Salary(Base):
    __tablename__ = "salary"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    notes = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.now)
    owner_id = Column(Integer, ForeignKey("users.id"))