"""
AyurGPT Backend Configuration
"""

from functools import lru_cache
from typing import Any, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AyurGPT"
    PROJECT_DESCRIPTION: str = "AI-Powered Ayurvedic Knowledge & Wellness Assistant"
    VERSION: str = "0.1.0"

    # Server
    DEBUG: bool = True
    ENVIRONMENT: str = "development"  # development, staging, production
    BACKEND_PORT: int = 8000
    BACKEND_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = "sqlite:///./ayurgpt_dev.db"
    DB_ECHO: bool = False

    # Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Vector Database
    VECTOR_DB_TYPE: str = "chromadb"  # pinecone or chromadb
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "ayurgpt-index"
    CHROMADB_PATH: str = "./chromadb_data"

    # LLM Configuration
    GROQ_API_KEY: Optional[str] = None
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MODEL: str = "llama-3.1-8b-instant"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    TEMPERATURE: float = 0.3
    MAX_TOKENS: int = 1024

    # RAG Configuration
    RAG_ENABLED: bool = False
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100
    TOP_K_RETRIEVAL: int = 5
    RETRIEVAL_THRESHOLD: float = 0.5

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]

    # Email
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SENDER_EMAIL: Optional[str] = None

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    @field_validator("DEBUG", "DB_ECHO", mode="before")
    @classmethod
    def parse_boolish_values(cls, value: Any) -> Any:
        """Accept common deployment labels where a boolean env var is expected."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production", "staging"}:
                return False
            if normalized in {"dev", "development"}:
                return True
        return value

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
