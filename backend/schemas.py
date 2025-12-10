from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- User ---
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    age: int
    gender: str

# --- Card ---
class CardCreate(BaseModel):
    name: str
    bank: str
    network: str
    total_limit: float
    manual_limit: float
    statement_date: int
    payment_due_date: int

class Card(CardCreate):
    id: int
    last_4: Optional[str] = None
    class Config:
        from_attributes = True

# --- Transaction ---
class TransactionBase(BaseModel):
    description: str
    amount: float
    type: str
    card_id: int
    tag_name: Optional[str] = None # Frontend sends this

class Transaction(BaseModel):
    id: int
    description: str
    amount: float
    date: datetime
    tag_id: Optional[int]
    class Config:
        from_attributes = True