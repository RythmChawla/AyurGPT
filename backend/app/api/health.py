"""
Health check and utility routes
"""

from fastapi import APIRouter
from app.config import get_settings
from app.schemas import HealthCheckResponse

router = APIRouter(tags=["health"])

settings = get_settings()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        message="AyurGPT backend is running",
        version=settings.VERSION
    )


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "api_docs": "/openapi.json"
    }
