from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.core.config import get_settings

settings = get_settings()
is_development = settings.app_env in {"development", "test"}

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="MediRoute API with password-based access-token authentication.",
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

app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])


@app.exception_handler(RequestValidationError)
async def safe_validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    """Avoid reflecting submitted passwords and other request values in errors."""
    safe_errors = [
        {key: value for key, value in error.items() if key not in {"input", "ctx"}}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": safe_errors})


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """Report process health only; this endpoint does not probe PostgreSQL."""
    return {"status": "ok", "service": settings.app_name}
