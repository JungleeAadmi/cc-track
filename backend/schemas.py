from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Base Models ---
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
    notify_payment_done: bool = True

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
    notify_payment_done: Optional[bool] = None

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- LENDING ---
class LendingBase(BaseModel):
    borrower_name: str
    amount: float
    lent_date: datetime
    reminder_date: Optional[datetime] = None
    attachment_lent: Optional[str] = None
    is_returned: bool = False
    returned_date: Optional[datetime] = None
    attachment_returned: Optional[str] = None

class LendingCreate(LendingBase):
    pass

class LendingUpdate(BaseModel):
    is_returned: bool
    returned_date: datetime
    attachment_returned: Optional[str] = None

class Lending(LendingBase):
    id: int
    owner_id: int
    class Config:
        from_attributes = True

# --- SALARY ---
class SalaryBase(BaseModel):
    amount: float
    date: datetime
    company_id: int

class SalaryCreate(SalaryBase):
    pass

class Salary(SalaryBase):
    id: int
    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str
    joining_date: datetime

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    salaries: List[Salary] = []
    class Config:
        from_attributes = True

# --- EXISTING CARDS/TXNS ---
class StatementBase(BaseModel):
    date: datetime
    amount: float
    card_id: int
    is_paid: bool = False
    payment_date: Optional[datetime] = None

class StatementCreate(StatementBase):
    pass

class StatementUpdate(BaseModel):
    date: Optional[datetime] = None
    amount: Optional[float] = None
    is_paid: Optional[bool] = None

class Statement(StatementBase):
    id: int
    class Config:
        from_attributes = True

class CardBase(BaseModel):
    name: str
    bank: str
    network: str
    card_type: str = "Credit Card"
    total_limit: float
    manual_limit: Optional[float] = None
    statement_date: int
    payment_due_date: int
    image_front: Optional[str] = None
    image_back: Optional[str] = None
    card_holder: Optional[str] = None
    last_4: Optional[str] = None 
    full_number: Optional[str] = None
    cvv: Optional[str] = None
    valid_thru: Optional[str] = None
    expiry_date: Optional[str] = None

class CardCreate(CardBase):
    pass

class CardUpdate(BaseModel):
    name: Optional[str] = None
    bank: Optional[str] = None
    network: Optional[str] = None
    card_type: Optional[str] = None
    total_limit: Optional[float] = None
    manual_limit: Optional[float] = None
    statement_date: Optional[int] = None
    payment_due_date: Optional[int] = None
    card_holder: Optional[str] = None
    last_4: Optional[str] = None
    full_number: Optional[str] = None
    cvv: Optional[str] = None
    valid_thru: Optional[str] = None
    image_front: Optional[str] = None
    image_back: Optional[str] = None
    expiry_date: Optional[str] = None

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

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    mode: Optional[str] = None
    date: Optional[datetime] = None
    is_emi: Optional[bool] = None
    emi_tenure: Optional[int] = None
    tag_name: Optional[str] = None

class Transaction(BaseModel):
    id: int
    description: str
    amount: float
    date: datetime
    tag_id: Optional[int]
    class Config:
        from_attributes = True