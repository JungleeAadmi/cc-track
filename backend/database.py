from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file
SQL_ALCHEMY_DATABASE_URL = "sqlite:///./cc_data.db"

# connect_args is needed only for SQLite to allow multi-threaded access
engine = create_engine(SQL_ALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- THIS IS THE MISSING FUNCTION ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()