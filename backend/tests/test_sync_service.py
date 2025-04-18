"""
Tests for the SyncService functionality.
"""

import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, UTC

from sqlalchemy.orm import Session

from app.services.sync_service import SyncService
from app.models.sync import Sync, SyncState


class TestSyncService(unittest.TestCase):
    """Tests for SyncService."""
    
    def setUp(self):
        """Set up the test environment."""
        self.mock_db = MagicMock(spec=Session)
        self.service = SyncService(self.mock_db)
        
        # Create a test sync
        self.test_sync = Sync(
            id=1,
            user_id=1,
            discussion_name="Test Discussion",
            state=SyncState.ACTIVE,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
    
    def test_get_sync(self):
        """Test getting a sync by ID."""
        # Set up the mock to return the test sync
        self.mock_db.get.return_value = self.test_sync
        
        # Call the method
        result = self.service.get_sync(1)
        
        # Verify the result
        self.assertEqual(result, self.test_sync)
        self.mock_db.get.assert_called_once_with(Sync, 1)
    
    def test_create_sync(self):
        """Test creating a new sync."""
        # Set up mocks
        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock()
        
        # Call the method
        result = self.service.create_sync(
            user_id=1,
            discussion_name="New Discussion",
            state=SyncState.ACTIVE
        )
        
        # Verify the result
        self.assertEqual(result.user_id, 1)
        self.assertEqual(result.discussion_name, "New Discussion")
        self.assertEqual(result.state, SyncState.ACTIVE)
        
        # Verify the mocks were called
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once()
    
    def test_update_sync(self):
        """Test updating a sync."""
        # Set up mocks
        self.mock_db.get.return_value = self.test_sync
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock()
        
        # Call the method
        success, sync = self.service.update_sync(
            1,
            discussion_name="Updated Discussion",
            state=SyncState.PAUSED
        )
        
        # Verify the result
        self.assertTrue(success)
        self.assertEqual(sync, self.test_sync)
        self.assertEqual(sync.discussion_name, "Updated Discussion")
        self.assertEqual(sync.state, SyncState.PAUSED)
        
        # Verify the mocks were called
        self.mock_db.get.assert_called_once_with(Sync, 1)
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once()
    
    def test_update_sync_not_found(self):
        """Test updating a non-existent sync."""
        # Set up the mock to return None
        self.mock_db.get.return_value = None
        
        # Call the method
        success, sync = self.service.update_sync(999, discussion_name="Invalid")
        
        # Verify the result
        self.assertFalse(success)
        self.assertIsNone(sync)
        
        # Verify the mock was called
        self.mock_db.get.assert_called_once_with(Sync, 999)
    
    def test_delete_sync(self):
        """Test deleting a sync."""
        # Set up mocks
        self.mock_db.get.return_value = self.test_sync
        self.mock_db.delete = MagicMock()
        self.mock_db.commit = MagicMock()
        
        # Call the method
        result = self.service.delete_sync(1)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the mocks were called
        self.mock_db.get.assert_called_once_with(Sync, 1)
        self.mock_db.delete.assert_called_once_with(self.test_sync)
        self.mock_db.commit.assert_called_once()
    
    def test_delete_sync_not_found(self):
        """Test deleting a non-existent sync."""
        # Set up the mock to return None
        self.mock_db.get.return_value = None
        
        # Call the method
        result = self.service.delete_sync(999)
        
        # Verify the result
        self.assertFalse(result)
        
        # Verify the mock was called
        self.mock_db.get.assert_called_once_with(Sync, 999)
    
    def test_get_all_syncs(self):
        """Test getting all syncs."""
        # Set up mock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [self.test_sync]
        self.mock_db.execute.return_value = mock_result
        
        # Call the method
        result = self.service.get_all_syncs()
        
        # Verify the result
        self.assertEqual(result, [self.test_sync])
        
        # Verify the mock was called
        self.mock_db.execute.assert_called_once()
    
    def test_get_user_syncs(self):
        """Test getting all syncs for a specific user."""
        # Set up mock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [self.test_sync]
        self.mock_db.execute.return_value = mock_result
        
        # Call the method
        result = self.service.get_user_syncs(1)
        
        # Verify the result
        self.assertEqual(result, [self.test_sync])
        
        # Verify the mock was called
        self.mock_db.execute.assert_called_once()
    
    def test_get_syncs_by_state(self):
        """Test getting all syncs with a specific state."""
        # Set up mock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [self.test_sync]
        self.mock_db.execute.return_value = mock_result
        
        # Call the method
        result = self.service.get_syncs_by_state(SyncState.ACTIVE)
        
        # Verify the result
        self.assertEqual(result, [self.test_sync])
        
        # Verify the mock was called
        self.mock_db.execute.assert_called_once()


if __name__ == "__main__":
    unittest.main() 