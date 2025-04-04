"""
Tests for the API v1 router module.
"""

import pytest
from fastapi import APIRouter
from fastapi.routing import APIRoute, APIRouter

from app.api.v1.router import router
from app.api.v1 import telegram, db

def test_router_prefix():
    """Test that the router has the correct prefix."""
    assert router.prefix == "/v1"

def test_telegram_router_included():
    """Test that the telegram router is included in the main router."""
    # In FastAPI, included routers become part of the main router's routes
    # Check routes by examining their paths
    telegram_paths = set(route.path for route in telegram.router.routes)
    
    # The included routes will have the prefix added
    prefixed_telegram_paths = set(f"/v1{path}" for path in telegram_paths)
    
    # Get all paths in the main router
    router_paths = set(route.path for route in router.routes)
    
    # Check that all telegram paths are in the main router
    for path in prefixed_telegram_paths:
        assert path in router_paths, f"Path {path} from telegram router not found in main router"

def test_db_router_included():
    """Test that the db router is included in the main router."""
    # In FastAPI, included routers become part of the main router's routes
    # Check routes by examining their paths
    db_paths = set(route.path for route in db.router.routes)
    
    # The included routes will have the prefix added
    prefixed_db_paths = set(f"/v1{path}" for path in db_paths)
    
    # Get all paths in the main router
    router_paths = set(route.path for route in router.routes)
    
    # Check that all db paths are in the main router
    for path in prefixed_db_paths:
        assert path in router_paths, f"Path {path} from db router not found in main router"

def test_router_has_routes():
    """Test that the router has routes from both included routers."""
    # Total routes should be at least the sum of routes from both included routers
    # (Could be more if the main router adds its own routes)
    min_expected_routes = len(telegram.router.routes) + len(db.router.routes)
    assert len(router.routes) >= min_expected_routes, "Main router missing some routes from included routers" 