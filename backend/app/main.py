from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.api import auth, users, resumes, interviews, analytics

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
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
    """Active health check that validates both web server and database connectivity.
    Pinging this endpoint with UptimeRobot keeps both Render and Supabase active."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "service": settings.PROJECT_NAME,
            "database": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unreachable: {str(e)}",
        )


# ── DEBUG ──────────────────────────────────────────────────────────────────────
@app.get("/debug")
def debug():
    return {
        "cors_origins": settings.BACKEND_CORS_ORIGINS,
        "database_host": settings.DATABASE_URL.split("@")[-1],
        "database_url_prefix": settings.DATABASE_URL.split("@")[0].split(":")[0],
    }