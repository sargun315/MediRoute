from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed settings; secrets are never stored in source code."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "MediRoute API"
    app_env: Literal["development", "test", "production"] = "development"
    app_secret_key: SecretStr = SecretStr("")
    database_url: str = "postgresql+psycopg://localhost:5432/mediroute"
    test_database_url: str = "sqlite+pysqlite:///:memory:"
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    access_token_expire_minutes: int = 15

    @field_validator("access_token_expire_minutes")
    @classmethod
    def validate_access_token_expiry(cls, value: int) -> int:
        if value < 1 or value > 60:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 1 and 60.")
        return value

    @field_validator("app_secret_key")
    @classmethod
    def validate_secret_placeholder(cls, value: SecretStr) -> SecretStr:
        secret = value.get_secret_value()
        if secret and len(secret) < 32:
            raise ValueError("APP_SECRET_KEY must contain at least 32 characters when set.")
        return value

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.app_env == "production":
            if len(self.app_secret_key.get_secret_value()) < 32:
                raise ValueError("APP_SECRET_KEY must be configured before production startup.")
            if not self.database_url.startswith("postgresql+"):
                raise ValueError("Production DATABASE_URL must use PostgreSQL.")
        return self

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.frontend_origins.split(",")]
        return [origin for origin in origins if origin]


@lru_cache
def get_settings() -> Settings:
    return Settings()
