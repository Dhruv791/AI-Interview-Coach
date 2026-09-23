from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.services.cleanup import cleanup_expired_guests
from app.api import auth, users, resumes, interviews, analytics

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup: Ensure is_guest column exists & run initial cleanup ───────────
    db = SessionLocal()
    try:
        # Auto-apply is_guest column if it doesn't already exist
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;"))
        db.commit()
        # Clean up any guests older than 24h
        cleaned = cleanup_expired_guests(db)
        logger.info(f"Startup completed. Purged {cleaned} expired guest account(s).")
    except Exception as e:
        db.rollback()
        logger.warning(f"Startup migration/cleanup warning: {e}")
    finally:
        db.close()

    yield
    # ── Shutdown ───────────────────────────────────────────────────────────────


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(interviews.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health_check(db: Session = Depends(get_db)):
    """
    Active health check that validates web server and database connectivity.
    Also executes background guest account cleanup with isolated error handling.
    """
    # 1. Primary DB liveness check
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unreachable: {str(e)}",
        )

    # 2. Opportunistic guest cleanup (failure NEVER breaks /health response)
    try:
        cleanup_expired_guests(db)
    except Exception as e:
        logger.error(f"Health-check guest cleanup caught non-fatal error: {e}")

    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "database": "connected",
    }


# ── DEBUG ──────────────────────────────────────────────────────────────────────
@app.get("/debug")
def debug():
    return {
        "cors_origins": settings.BACKEND_CORS_ORIGINS,
        "database_host": settings.DATABASE_URL.split("@")[-1],
        "database_url_prefix": settings.DATABASE_URL.split("@")[0].split(":")[0],
    }