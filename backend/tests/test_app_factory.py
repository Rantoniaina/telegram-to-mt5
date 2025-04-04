"""
Tests for the FastAPI application factory module.
"""

import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from unittest.mock import patch, MagicMock, AsyncMock

from app.core.app_factory import create_app, debug_request_middleware, lifespan
from app.config.settings import settings
from app.api.v1.router import router as v1_router
from app.api.v1.telegram import active_sessions

@pytest.fixture
def app():
    """Return a test instance of the FastAPI application."""
    return create_app()

def test_app_creation():
    """Test that the app is created with correct title, description, and version."""
    app = create_app()
    assert app.title == settings.API_TITLE
    assert app.description == settings.API_DESCRIPTION
    assert app.version == settings.API_VERSION
    # FastAPI stores lifespan handlers internally and doesn't expose them directly
    # so we can't test app.lifespan == lifespan

def test_cors_middleware_included(app):
    """Test that CORS middleware is properly configured."""
    # Find the CORS middleware in the app's middleware stack
    cors_middleware = None
    for middleware in app.user_middleware:
        if middleware.cls == CORSMiddleware:
            cors_middleware = middleware
            break
    
    assert cors_middleware is not None, "CORS middleware not found"
    
    # In FastAPI, middleware options are accessed through the kwargs attribute
    assert cors_middleware.kwargs.get("allow_origins") == settings.CORS_ORIGINS
    assert cors_middleware.kwargs.get("allow_credentials") == settings.CORS_ALLOW_CREDENTIALS
    assert cors_middleware.kwargs.get("allow_methods") == settings.CORS_ALLOW_METHODS
    assert cors_middleware.kwargs.get("allow_headers") == settings.CORS_ALLOW_HEADERS
    assert cors_middleware.kwargs.get("expose_headers") == ["Content-Type", "Authorization", "Accept"]
    assert cors_middleware.kwargs.get("max_age") == 600

def test_debug_middleware_included():
    """Test that debug middleware is included when DEBUG is True."""
    with patch('app.core.app_factory.settings') as mock_settings:
        # Set DEBUG to True
        mock_settings.DEBUG = True
        mock_settings.API_TITLE = settings.API_TITLE
        mock_settings.API_DESCRIPTION = settings.API_DESCRIPTION
        mock_settings.API_VERSION = settings.API_VERSION
        mock_settings.CORS_ORIGINS = settings.CORS_ORIGINS
        mock_settings.CORS_ALLOW_CREDENTIALS = settings.CORS_ALLOW_CREDENTIALS
        mock_settings.CORS_ALLOW_METHODS = settings.CORS_ALLOW_METHODS
        mock_settings.CORS_ALLOW_HEADERS = settings.CORS_ALLOW_HEADERS
        
        # Mock the debug_request_middleware to track if it was called
        with patch('app.core.app_factory.debug_request_middleware') as mock_middleware:
            app = create_app()
            
            # Check if our middleware was registered by checking functions in FastAPI's middleware stack
            middleware_functions = [m.cls.__name__ for m in app.user_middleware]
            assert "BaseHTTPMiddleware" in middleware_functions, "Debug middleware not included when DEBUG is True"

def test_debug_middleware_excluded():
    """Test that debug middleware is excluded when DEBUG is False."""
    with patch('app.core.app_factory.settings') as mock_settings:
        # Set DEBUG to False
        mock_settings.DEBUG = False
        mock_settings.API_TITLE = settings.API_TITLE
        mock_settings.API_DESCRIPTION = settings.API_DESCRIPTION
        mock_settings.API_VERSION = settings.API_VERSION
        mock_settings.CORS_ORIGINS = settings.CORS_ORIGINS
        mock_settings.CORS_ALLOW_CREDENTIALS = settings.CORS_ALLOW_CREDENTIALS
        mock_settings.CORS_ALLOW_METHODS = settings.CORS_ALLOW_METHODS
        mock_settings.CORS_ALLOW_HEADERS = settings.CORS_ALLOW_HEADERS
        
        with patch('app.core.app_factory.debug_request_middleware') as mock_middleware:
            # In app_factory, middleware is added with app.middleware("http")(debug_request_middleware)
            # So when creating the app, if debug is true, it should call this middleware function
            app = create_app()
            
            # If DEBUG is False, our middleware should not be called/used
            mock_middleware.assert_not_called()
            
            # Only CORS middleware should be present (not BaseHTTPMiddleware for debug)
            middleware_classes = [m.cls.__name__ for m in app.user_middleware]
            assert "CORSMiddleware" in middleware_classes
            assert "BaseHTTPMiddleware" not in middleware_classes, "Debug middleware included when DEBUG is False"

def test_router_inclusion(app):
    """Test that v1 router is included in the app."""
    # Get all paths in the app
    app_paths = [route.path for route in app.routes]
    
    # Get all paths from the v1_router
    v1_paths = [route.path for route in v1_router.routes]
    
    # When a router is included in a FastAPI app, its paths are already prefixed
    # We need to check that each route from v1_router appears in the app
    # The routes in app will have v1_router.prefix already applied to them
    for v1_route in v1_router.routes:
        # The actual path in the app will have the prefix
        expected_path = v1_route.path
        # If the path is already prefixed with the router prefix, don't add it again
        if not expected_path.startswith(v1_router.prefix):
            expected_path = f"{v1_router.prefix}{expected_path}"
        
        assert expected_path in app_paths, f"Path {expected_path} from v1_router not found in app"

@pytest.mark.asyncio
async def test_debug_request_middleware():
    """Test that debug request middleware logs appropriately."""
    # Create mock request and response
    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.url = "http://test.com/api"
    mock_request.headers = {"User-Agent": "Test"}
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    
    mock_call_next = AsyncMock(return_value=mock_response)
    
    # Mock the logger
    with patch('app.core.app_factory.logger') as mock_logger:
        # Call the middleware
        response = await debug_request_middleware(mock_request, mock_call_next)
        
        # Check that logger was called with expected arguments
        mock_logger.info.assert_any_call(f"Request: {mock_request.method} {mock_request.url}")
        mock_logger.info.assert_any_call(f"Headers: {mock_request.headers}")
        mock_logger.info.assert_any_call(f"Response status: {mock_response.status_code}")
        
        # Check that response is returned correctly
        assert response == mock_response
        
        # Check that call_next was called once with the request
        mock_call_next.assert_called_once_with(mock_request)

@pytest.mark.asyncio
async def test_lifespan():
    """Test the lifespan context manager."""
    mock_app = MagicMock()
    
    # Mock the init_db function
    with patch('app.core.app_factory.init_db') as mock_init_db, \
         patch('app.core.app_factory.logger') as mock_logger, \
         patch('app.core.app_factory.active_sessions') as mock_active_sessions:
        
        # Create some mock sessions
        mock_session1 = AsyncMock()
        mock_session2 = AsyncMock()
        mock_active_sessions.items.return_value = [
            ("session1", mock_session1),
            ("session2", mock_session2)
        ]
        
        # Use the lifespan context manager
        async with lifespan(mock_app):
            # Check startup actions
            mock_logger.info.assert_any_call("Initializing database...")
            mock_init_db.assert_called_once()
            mock_logger.info.assert_any_call("Database initialized successfully")
        
        # Check shutdown actions
        mock_session1.disconnect.assert_called_once()
        mock_session2.disconnect.assert_called_once() 