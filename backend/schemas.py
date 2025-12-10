from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User ---
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- Card ---
class CardBase(BaseModel):
    name: str
    bank: str
    network: str
    currency: str = "USD" # NEW
    total_limit: float
    manual_limit: Optional[float] = None
    statement_date: int
    payment_due_date: int

class CardCreate(CardBase):
    pass

class Card(CardBase):
    id: int
    last_4: Optional[str] = None
    owner_id: int
    # Calculated fields (not in DB, computed on fly)
    spent: float = 0.0 
    available: float = 0.0
    
    class Config:
        from_attributes = True

# --- Transaction ---
class TransactionBase(BaseModel):
    description: str
    amount: float
    type: str
    card_id: int
    tag_name: Optional[str] = None 

class Transaction(BaseModel):
    id: int
    description: str
    amount: float
    date: datetime
    tag_id: Optional[int]
    class Config:
        from_attributes = True