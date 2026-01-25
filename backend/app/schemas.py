from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SimpleResponse(BaseModel):
    message: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    username: str
    currency: str
    ntfy_url: Optional[str] = None
    ntfy_topic: Optional[str] = None

class UserSettings(BaseModel):
    currency: str
    ntfy_url: Optional[str] = None
    ntfy_topic: Optional[str] = None

# --- Statements ---
class StatementOut(BaseModel):
    id: int
    month: str
    generated_date: datetime
    due_date: datetime
    total_due: float
    min_due: float
    is_paid: bool
    paid_amount: float
    paid_date: Optional[datetime]
    payment_ref: Optional[str]
    attachment_path: Optional[str]
    class Config:
        from_attributes = True

# --- Cards ---
class CardCreate(BaseModel):
    name: str
    bank_name: str
    card_network: str
    card_type: str
    card_number: str # Full number
    cvv: Optional[str] = None
    expiry_date: str
    owner_name: str
    limit: float
    statement_date: Optional[int] = None
    payment_due_date: Optional[int] = None
    color_theme: str = "gradient-1"

class CardOut(BaseModel):
    id: int
    name: str
    bank_name: str
    card_network: str
    card_type: str
    card_number: str # Full number
    card_number_last4: str
    cvv: Optional[str]
    expiry_date: str
    owner_name: str
    limit: float
    statement_date: Optional[int]
    payment_due_date: Optional[int]
    front_image_path: Optional[str]
    back_image_path: Optional[str]
    color_theme: str
    statements: List[StatementOut] = []
    class Config:
        from_attributes = True

# --- Companies & Salary ---
class CompanyCreate(BaseModel):
    name: str
    joining_date: datetime
    relieving_date: Optional[datetime] = None
    is_current: bool = False

class CompanyOut(BaseModel):
    id: int
    name: str
    logo_path: Optional[str]
    joining_date: datetime
    relieving_date: Optional[datetime]
    is_current: bool
    class Config:
        from_attributes = True

class SalaryCreate(BaseModel):
    amount: float
    month: str
    year: int
    company_id: int

class SalaryOut(BaseModel):
    id: int
    amount: float
    month: str
    year: int
    attachment_path: Optional[str]
    date_added: datetime
    company_id: int
    class Config:
        from_attributes = True

# --- Transactions ---
class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str
    date: Optional[datetime] = None
    card_id: Optional[int] = None
    merchant_location: Optional[str] = None
    payment_mode: str = "online"
    is_emi: bool = False
    emi_months: Optional[int] = None

class TransactionOut(BaseModel):
    id: int
    description: str
    amount: float
    date: datetime
    type: str
    card_id: Optional[int]
    merchant_location: Optional[str]
    payment_mode: str
    is_emi: bool
    emi_months: Optional[int]
    attachment_path: Optional[str]
    class Config:
        from_attributes = True

# --- Lending ---
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

# --- Subscriptions ---
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

# --- Dashboard ---
class DashboardStats(BaseModel):
    card_count: int
    transaction_count: int
    active_lending_count: int
    pending_lending_amount: float
    monthly_subs: float
    last_salary: float