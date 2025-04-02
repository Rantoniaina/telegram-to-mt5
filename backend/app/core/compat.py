"""
Compatibility fixes for Python 3.13+ which removed some modules.

This module provides a workaround for the removed 'imghdr' module that Telethon depends on.
"""

import os
import sys


def setup_imghdr_compatibility():
    """
    Create a mock imghdr module for Python 3.13+ compatibility with Telethon.
    
    Python 3.13 removed the imghdr module, but Telethon still depends on it.
    This function creates a minimal mock implementation that provides the
    functionality Telethon needs.
    """
    if 'imghdr' not in sys.modules and not any(p.endswith('imghdr.py') for p in sys.path):
        # Define minimal implementation of imghdr for Telethon
        class MockImghdr:
            def what(self, file, h=None):
                """
                Minimal implementation of imghdr.what() function.
                Telethon only uses this to detect image types.
                
                Args:
                    file: Either a path to a file or a file-like object
                    h: The first 32 bytes of the file (optional)
                
                Returns:
                    String indicating image type or None if not recognized
                """
                if h is None:
                    if isinstance(file, str):
                        with open(file, 'rb') as f:
                            h = f.read(32)
                    else:
                        pos = file.tell()
                        h = file.read(32)
                        file.seek(pos)
                
                if not h:
                    return None
                
                # Check for common image formats by their magic bytes
                if h.startswith(b'\xff\xd8'):  # JPEG
                    return 'jpeg'
                elif h.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
                    return 'png'
                elif h.startswith(b'GIF87a') or h.startswith(b'GIF89a'):  # GIF
                    return 'gif'
                elif h.startswith(b'RIFF') and h[8:12] == b'WEBP':  # WEBP
                    return 'webp'
                elif h.startswith(b'\x00\x00\x01\x00'):  # ICO
                    return 'ico'
                elif h.startswith(b'BM'):  # BMP
                    return 'bmp'
                elif h.startswith(b'\x00\x00\x00\x0c\x6a\x50\x20\x20\x0d\x0a\x87\x0a'):  # JP2
                    return 'jp2'
                
                return None
        
        # Create the mock module and add it to sys.modules
        mock_imghdr = MockImghdr()
        sys.modules['imghdr'] = mock_imghdr 