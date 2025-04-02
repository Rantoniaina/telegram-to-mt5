"""
Main application entry point.
"""

import uvicorn
from app.core.app_factory import create_app
from app.config.settings import settings

# Create the FastAPI application
app = create_app()

if __name__ == "__main__":
    """Run the application using uvicorn server."""
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    ) 