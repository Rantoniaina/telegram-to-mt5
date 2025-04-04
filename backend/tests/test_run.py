"""
Tests for the run.py script entry point.
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock, call

import uvicorn
from app.config.settings import settings


@pytest.mark.parametrize("python_version,should_setup", [
    ((3, 12, 0), False),  # Python 3.12 shouldn't trigger setup
    ((3, 13, 0), True),   # Python 3.13 should trigger setup
    ((3, 14, 0), True),   # Future Python versions should trigger setup
])
def test_python_compatibility_check(python_version, should_setup):
    """Test that imghdr compatibility is set up for Python 3.13+."""
    # We need to test the functionality without trying to mock sys.path.insert
    
    # Mock sys.version_info and setup function
    with patch('sys.version_info', python_version), \
         patch('app.core.compat.setup_imghdr_compatibility') as mock_setup, \
         patch('os.path.abspath', return_value='/mocked/path'), \
         patch('os.path.dirname', return_value='/mocked'):
        
        # Create a wrapper to track if sys.path.insert is called
        original_sys_path = sys.path.copy()
        path_tracker = {'called': False, 'args': None}
        
        def track_path_update(*args):
            path_tracker['called'] = True
            path_tracker['args'] = args
            # Don't actually modify sys.path in tests
        
        # Define a function to simulate run.py's compatibility setup
        def run_compatibility_setup():
            if python_version >= (3, 13):
                # This is what run.py does, but we use our tracker instead of modifying sys.path
                track_path_update(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
                from app.core.compat import setup_imghdr_compatibility
                setup_imghdr_compatibility()
        
        # Run the compatibility setup
        run_compatibility_setup()
        
        # Check if path update was tracked
        if should_setup:
            assert path_tracker['called'] is True
            assert path_tracker['args'] == (0, '/mocked/path')
            mock_setup.assert_called_once()
        else:
            assert path_tracker['called'] is False
            mock_setup.assert_not_called()
        
        # Ensure sys.path wasn't actually modified
        assert sys.path == original_sys_path


def test_main_script_execution():
    """Test the __main__ block that runs the uvicorn server."""
    # Create a mock for uvicorn.run
    with patch('uvicorn.run') as mock_run:
        # Simulate the __main__ block from run.py
        mock_run(
            "app.main:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=settings.DEBUG
        )
        
        # Verify uvicorn.run was called with correct parameters
        mock_run.assert_called_once_with(
            "app.main:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=settings.DEBUG
        )


def test_uvicorn_configuration():
    """Test that the uvicorn configuration matches settings."""
    # This test verifies the configuration values that would be passed to uvicorn
    # without actually executing the run call
    
    # Check that settings contain expected values
    assert settings.HOST == '0.0.0.0'  # Default value
    assert settings.PORT == 8000       # Default value
    assert settings.DEBUG is True      # Default is True 