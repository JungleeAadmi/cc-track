from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str

class UserSettings(BaseModel):
    currency: str
    ntfy_url: Optional[str] = None
    ntfy_topic: Optional[str] = None

class UserOut(BaseModel):
    username: str
    currency: str
    ntfy_url: Optional[str] = None
    ntfy_topic: Optional[str] = None

class SimpleResponse(BaseModel):
    message: str

class CardCreate(BaseModel):
    name: str

class CardOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str
    date: Optional[datetime] = None

class TransactionOut(BaseModel):
    id: int
    description: str
    amount: float
    date: datetime
    type: str
    class Config:
        from_attributes = True

class LendingReturnOut(BaseModel):
    id: int
    amount: float
    return_date: datetime
    proof_image_path: Optional[str] = None
    class Config:
        from_attributes = True

class LendingCreate(BaseModel):
    person_name: str
    total_amount: float
    lent_date: Optional[datetime] = None

class LendingOut(BaseModel):
    id: int
    person_name: str
    total_amount: float
    lent_date: datetime
    is_settled: bool
    returned_amount: float
    pending_amount: float
    returns: List[LendingReturnOut] = []
    class Config:
        from_attributes = True

class SubscriptionCreate(BaseModel):
    name: str
    amount: float

class SubscriptionOut(BaseModel):
    id: int
    name: str
    amount: float
    active: bool
    class Config:
        from_attributes = True

class SalaryCreate(BaseModel):
    amount: float
    notes: Optional[str] = None

class SalaryOut(BaseModel):
    id: int
    amount: float
    notes: Optional[str] = None
    date: datetime
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    card_count: int
    transaction_count: int
    active_lending_count: int
    pending_lending_amount: float
    monthly_subs: float
    last_salary: float