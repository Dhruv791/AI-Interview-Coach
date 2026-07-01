from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# pool_pre_ping=True checks for connection validity on checkouts
# which is vital for production deployments on Render/Supabase where connections drop.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# Dependency to provide db session to route parameters
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
