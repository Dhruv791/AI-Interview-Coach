# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.core.config import settings
# from app.api import auth, users, resumes, interviews, analytics

# app = FastAPI(
#     title=settings.PROJECT_NAME,
#     openapi_url=f"{settings.API_V1_STR}/openapi.json",
#     docs_url=f"{settings.API_V1_STR}/docs",
#     redoc_url=f"{settings.API_V1_STR}/redoc",
# )

# # ── CORS ───────────────────────────────────────────────────────────────────────
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.BACKEND_CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── Routers ────────────────────────────────────────────────────────────────────
# app.include_router(auth.router, prefix=settings.API_V1_STR)
# app.include_router(users.router, prefix=settings.API_V1_STR)
# app.include_router(resumes.router, prefix=settings.API_V1_STR)
# app.include_router(interviews.router, prefix=settings.API_V1_STR)
# app.include_router(analytics.router, prefix=settings.API_V1_STR)


# # ── Health check ───────────────────────────────────────────────────────────────
# @app.get("/health", tags=["health"])
# def health_check():
#     return {"status": "ok", "service": settings.PROJECT_NAME}


from app.core.config import settings

@app.get("/debug")
def debug():
    return {
        "cors": settings.BACKEND_CORS_ORIGINS,
        "database": settings.DATABASE_URL.split("@")[1],
    }