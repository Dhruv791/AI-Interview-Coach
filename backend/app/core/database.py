from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# Optimized pool settings for cloud Postgres (Supabase pooler/Render)
# - pool_pre_ping=True: tests connection liveness before checkout
# - pool_recycle=300: recycles connections after 5 minutes to prevent stale dropped connections
# - pool_timeout=10: fails fast if pool is exhausted rather than hanging requests
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
    pool_timeout=10,
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
