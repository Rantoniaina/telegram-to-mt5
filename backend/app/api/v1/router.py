"""
API router for v1.
"""

from fastapi import APIRouter

from app.api.v1.telegram import router as telegram_router

# Create main v1 router
router = APIRouter(prefix="/v1")

# Include all sub-routers
router.include_router(telegram_router) 