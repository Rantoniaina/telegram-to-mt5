#!/usr/bin/env python3
"""
Entry point script to run the API server.
"""

import sys
import uvicorn

# Apply compatibility fixes for Python 3.13+
if sys.version_info >= (3, 13):
    # We need to add the backend directory to the path for imports to work correctly
    import os
    import pathlib
    sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
    
    from app.core.compat import setup_imghdr_compatibility
    setup_imghdr_compatibility()

from app.config.settings import settings

if __name__ == "__main__":
    """Run the application using uvicorn server."""
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    ) 