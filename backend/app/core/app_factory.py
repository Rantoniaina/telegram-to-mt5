"""
FastAPI application factory.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.api.v1.telegram import active_sessions
from app.config.settings import settings
from app.core.database import init_db

# Set up logger
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for the FastAPI application.
    Manages startup and shutdown events.
    """
    # Startup: Initialize the database
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")
    
    yield
    
    # Shutdown: Disconnect all active Telegram sessions
    for session_id, service in active_sessions.items():
        await service.disconnect()

# Debug middleware
async def debug_request_middleware(request: Request, call_next):
    """Log request details for debugging purposes."""
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    
    response = await call_next(request)
    
    logger.info(f"Response status: {response.status_code}")
    return response

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    """
    app = FastAPI(
        title=settings.API_TITLE,
        description=settings.API_DESCRIPTION,
        version=settings.API_VERSION,
        lifespan=lifespan
    )

    # Add debug middleware
    if settings.DEBUG:
        app.middleware("http")(debug_request_middleware)
    
    # Add CORS middleware to allow cross-origin requests
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
        expose_headers=["Content-Type", "Authorization", "Accept"],
        max_age=600,  # Cache preflight requests for 10 minutes
    )

    # Include API routers
    app.include_router(v1_router)

    return app 