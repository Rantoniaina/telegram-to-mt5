#!/usr/bin/env python3
"""
Entry point script to run the API server.
"""

import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    """Run the application using uvicorn server."""
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    ) 