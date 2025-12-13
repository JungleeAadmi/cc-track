from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    currency: Optional[str] = "USD"
    ntfy_topic: Optional[str] = None
    ntfy_server: Optional[str] = "https://ntfy.sh"
    notify_card_add: bool = True
    notify_txn_add: bool = True
    notify_card_del: bool = True
    notify_statement: bool = True
    notify_due_dates: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None
    ntfy_topic: Optional[str] = None
    ntfy_server: Optional[str] = None
    password: Optional[str] = None
    notify_card_add: Optional[bool] = None
    notify_txn_add: Optional[bool] = None
    notify_card_del: Optional[bool] = None
    notify_statement: Optional[bool] = None
    notify_due_dates: Optional[bool] = None

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# NEW: Statement Schemas
class StatementBase(BaseModel):
    date: datetime
    amount: float
    card_id: int

class StatementCreate(StatementBase):
    pass

class Statement(StatementBase):
    id: int
    class Config:
        from_attributes = True

class CardBase(BaseModel):
    name: str
    bank: str
    network: str
    card_type: str = "Credit Card"
    expiry_date: Optional[str] = None
    total_limit: float
    manual_limit: Optional[float] = None
    statement_date: int
    payment_due_date: int
    image_front: Optional[str] = None
    image_back: Optional[str] = None
    last_4: Optional[str] = None 

class CardCreate(CardBase):
    pass

class Card(CardBase):
    id: int
    owner_id: int
    spent: float = 0.0 
    available: float = 0.0
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    description: str
    amount: float
    type: str
    mode: str = "Online"
    date: Optional[datetime] = None
    is_emi: bool = False
    emi_tenure: Optional[int] = None
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