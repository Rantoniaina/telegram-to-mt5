"""
API endpoints for database operations.
"""

from typing import List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.telegram_data import User
from app.services.db_service import DatabaseService
from app.schemas.db import UserResponse

router = APIRouter(prefix="/db", tags=["database"])

# Helper function to get database service
def get_db_service(db: Session = Depends(get_db)) -> DatabaseService:
    return DatabaseService(db)

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db_service: DatabaseService = Depends(get_db_service)
):
    """Get all users stored in the database."""
    return db_service.get_all_users()

@router.get("/users/{api_id}", response_model=UserResponse)
async def get_user(
    api_id: str,
    db_service: DatabaseService = Depends(get_db_service)
):
    """Get a specific user by API ID."""
    user = db_service.get_user(api_id)
    if not user:
        return {"detail": "User not found"}
    return user

@router.post("/users", response_model=UserResponse)
async def create_user(
    api_id: str = Body(..., embed=True),
    db_service: DatabaseService = Depends(get_db_service)
):
    """Create a new user if it doesn't exist."""
    return db_service.create_user_if_not_exists(api_id)

@router.delete("/users/{api_id}")
async def delete_user(
    api_id: str,
    db_service: DatabaseService = Depends(get_db_service)
):
    """Delete a user by API ID."""
    success = db_service.delete_user(api_id)
    if success:
        return {"detail": "User deleted successfully"}
    return {"detail": "User not found"} 