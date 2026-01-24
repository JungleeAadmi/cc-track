from sqlalchemy import Column, Integer, String, ForeignKey, Float, Date
from backend.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)


class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    description = Column(String)


class Lending(Base):
    __tablename__ = "lending"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    person = Column(String)
    total_amount = Column(Float)


class LendingReturn(Base):
    __tablename__ = "lending_returns"
    id = Column(Integer, primary_key=True)
    lending_id = Column(Integer, ForeignKey("lending.id"))
    amount = Column(Float)
    proof = Column(String)
    date = Column(Date)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    amount = Column(Float)


class NtfyConfig(Base):
    __tablename__ = "ntfy_config"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    server_url = Column(String)
    topic = Column(String)
