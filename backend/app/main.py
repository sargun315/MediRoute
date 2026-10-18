from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()
is_development = settings.app_env in {"development", "test"}

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="MediRoute backend foundation. Application APIs are not implemented yet.",
    docs_url="/docs" if is_development else None,
    redoc_url="/redoc" if is_development else None,
    openapi_url="/openapi.json" if is_development else None,
)

if "*" in settings.cors_origins:
    raise RuntimeError("Wildcard CORS origins are not allowed for MediRoute.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """Report process health only; this endpoint does not probe PostgreSQL."""
    return {"status": "ok", "service": settings.app_name}
