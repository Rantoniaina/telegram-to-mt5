"""
Tests for the compatibility module.
"""

import io
import os
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

import pytest

from app.core.compat import setup_imghdr_compatibility


class TestCompatModule(unittest.TestCase):
    """Tests for the compatibility fixes in the compat module."""
    
    def setUp(self):
        """Set up the test environment."""
        # Save original sys.modules state
        self.original_modules = sys.modules.copy()
        
        # Remove imghdr from sys.modules if it exists
        if 'imghdr' in sys.modules:
            del sys.modules['imghdr']
    
    def tearDown(self):
        """Clean up after tests."""
        # Restore original sys.modules
        sys.modules.clear()
        sys.modules.update(self.original_modules)
    
    def test_setup_imghdr_compatibility(self):
        """Test that the compatibility setup adds imghdr to sys.modules."""
        # Ensure imghdr is not in sys.modules
        self.assertNotIn('imghdr', sys.modules)
        
        # Run the setup function
        setup_imghdr_compatibility()
        
        # Check that imghdr is now in sys.modules
        self.assertIn('imghdr', sys.modules)
        
        # Check that the module has the required method
        self.assertTrue(hasattr(sys.modules['imghdr'], 'what'))
    
    def test_imghdr_what_with_file_path(self):
        """Test the mock imghdr.what function with a file path."""
        # Create a temporary JPEG file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp:
            # Write JPEG header bytes
            temp.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00')
            temp_path = temp.name
        
        try:
            # Set up compatibility
            setup_imghdr_compatibility()
            
            # Test file detection
            result = sys.modules['imghdr'].what(temp_path)
            self.assertEqual(result, 'jpeg')
        finally:
            # Clean up the temporary file
            os.unlink(temp_path)
    
    def test_imghdr_what_with_file_object(self):
        """Test the mock imghdr.what function with a file-like object."""
        # Create file-like object with PNG header
        file_obj = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 24)
        
        # Set up compatibility
        setup_imghdr_compatibility()
        
        # Test file detection
        result = sys.modules['imghdr'].what(file_obj)
        self.assertEqual(result, 'png')
        
        # Check that the file position is reset
        self.assertEqual(file_obj.tell(), 0)
    
    def test_imghdr_what_with_bytes(self):
        """Test the mock imghdr.what function with bytes directly."""
        # Set up compatibility
        setup_imghdr_compatibility()
        
        # Test various image formats with their headers
        test_cases = [
            (b'\xff\xd8\xff', 'jpeg'),
            (b'\x89PNG\r\n\x1a\n', 'png'),
            (b'GIF87a', 'gif'),
            (b'GIF89a', 'gif'),
            (b'RIFF\x00\x00\x00\x00WEBP', 'webp'),
            (b'\x00\x00\x01\x00', 'ico'),
            (b'BM\x00\x00\x00\x00', 'bmp'),
            (b'\x00\x00\x00\x0c\x6a\x50\x20\x20\x0d\x0a\x87\x0a', 'jp2'),
            (b'not an image', None),
            (b'', None),
        ]
        
        for header, expected_type in test_cases:
            result = sys.modules['imghdr'].what(None, header)
            self.assertEqual(result, expected_type, f"Failed for header: {header}")
    
    def test_no_setup_when_module_exists(self):
        """Test that setup does nothing when imghdr already exists."""
        # Create a mock imghdr module
        mock_imghdr = MagicMock()
        sys.modules['imghdr'] = mock_imghdr
        
        # Run setup
        setup_imghdr_compatibility()
        
        # Verify our mock is still there (not replaced)
        self.assertIs(sys.modules['imghdr'], mock_imghdr)
    
    def test_no_setup_when_path_exists(self):
        """Test that setup does nothing when imghdr.py exists in path."""
        # Add a fake imghdr.py to sys.path
        sys.path.append('imghdr.py')
        
        # Run setup
        setup_imghdr_compatibility()
        
        # Verify imghdr is not in sys.modules
        self.assertNotIn('imghdr', sys.modules)
        
        # Clean up
        sys.path.remove('imghdr.py')


# Additional test with pytest
def test_imghdr_compatibility_integration():
    """Integration test for the imghdr compatibility."""
    # Remove imghdr from sys.modules if it exists
    if 'imghdr' in sys.modules:
        del sys.modules['imghdr']
    
    # Set up compatibility
    setup_imghdr_compatibility()
    
    # Try to import imghdr (should use our mock)
    import imghdr
    
    # Test basic functionality
    assert hasattr(imghdr, 'what')
    
    # Test with a simple PNG header
    assert imghdr.what(None, b'\x89PNG\r\n\x1a\n') == 'png' 