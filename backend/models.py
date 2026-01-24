from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)


class NtfyConfig(Base):
    __tablename__ = "ntfy_config"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    server_url = Column(String, nullable=False)
    topic = Column(String, nullable=False)
