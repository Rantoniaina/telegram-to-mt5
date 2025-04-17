"""
API router for v1.
"""

from fastapi import APIRouter

from app.api.v1.telegram import router as telegram_router
from app.api.v1.db import router as db_router
from app.api.v1.sync import router as sync_router

# Create main v1 router
router = APIRouter(prefix="/v1")

# Include all sub-routers
router.include_router(telegram_router)
router.include_router(db_router)
router.include_router(sync_router) 