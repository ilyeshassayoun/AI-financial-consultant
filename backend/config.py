from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_ENV: str = "development"
    GROQ_API_KEY: str = ""
    LLM_ACCESS_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    RATE_LIMIT_DEFAULT: str = "30/minute"
    RATE_LIMIT_ANALYZE: str = "10/minute"
    RATE_LIMIT_CHAT: str = "20/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    DEBUG: bool = False
    COOKIE_SECURE: bool = False
    READINESS_TIMEOUT_SECONDS: float = 1.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in {"production", "prod"}

    def validate_deployment(self) -> None:
        """Fail closed when a production deployment has unsafe defaults."""
        insecure_secrets = {
            "", "change-me-in-production", "change-me-in-production-use-a-long-random-string"
        }
        if self.is_production and (
            self.JWT_SECRET_KEY in insecure_secrets or len(self.JWT_SECRET_KEY) < 32
        ):
            raise RuntimeError("JWT_SECRET_KEY must be a unique value of at least 32 characters in production")
        if self.is_production and not self.COOKIE_SECURE:
            raise RuntimeError("COOKIE_SECURE must be enabled in production")
        if self.is_production and (
            not self.cors_origins_list or "*" in self.cors_origins_list
        ):
            raise RuntimeError("CORS_ORIGINS must list explicit trusted origins in production")


settings = Settings()
