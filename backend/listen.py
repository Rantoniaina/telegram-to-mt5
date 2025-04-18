#!/usr/bin/env python3
"""
Script to listen for new messages in a Telegram channel.

Usage: python listen.py -d <dialog_id>

Example: python listen.py -d 123456789
"""

import os
import sys
import asyncio
import argparse
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Support for Python 3.13+
if sys.version_info >= (3, 13):
    # Add the backend directory to the path for imports to work
    sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
    
    from app.core.compat import setup_imghdr_compatibility
    setup_imghdr_compatibility()

from dotenv import load_dotenv
from app.services import TelegramService, TelegramListenerService

# Load environment variables
load_dotenv()

async def message_handler(message):
    """
    Handle new messages from Telegram.
    
    Args:
        message: Telethon Message object
    """
    # Print message information
    sender = await message.get_sender()
    sender_name = f"{getattr(sender, 'first_name', '')} {getattr(sender, 'last_name', '')}".strip()
    
    timestamp = message.date.strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"[{timestamp}] New message from {sender_name} (@{getattr(sender, 'username', 'unknown')})")
    logger.info(f"Message: {message.text}")
    logger.info("-" * 50)

async def main():
    """Main function to set up and run the listener."""
    parser = argparse.ArgumentParser(description="Listen for new Telegram messages")
    parser.add_argument('-d', '--dialog_id', type=int, required=True,
                      help='Dialog ID to listen to')
    args = parser.parse_args()
    
    # Get credentials from environment variables
    api_id = int(os.getenv("TELEGRAM_API_ID"))
    api_hash = os.getenv("TELEGRAM_API_HASH")
    phone = os.getenv("TELEGRAM_PHONE")
    
    if not all([api_id, api_hash, phone]):
        logger.error("Please set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_PHONE environment variables")
        sys.exit(1)
    
    # Initialize the Telegram service
    telegram_service = TelegramService(
        api_id=api_id,
        api_hash=api_hash,
        phone=phone
    )
    
    try:
        # Connect to Telegram
        await telegram_service.connect()
        
        # Initialize the listener service
        listener_service = TelegramListenerService(telegram_service)
        
        # Start listening for messages in the specified dialog
        success = await listener_service.start_listening(args.dialog_id, message_handler)
        
        if not success:
            logger.error(f"Failed to start listening to dialog {args.dialog_id}")
            return
            
        logger.info(f"Now listening for messages in dialog {args.dialog_id}")
        logger.info("Press Ctrl+C to stop listening...")
        
        # Keep the script running until interrupted
        while True:
            await asyncio.sleep(1)
            
    except ValueError as e:
        if "Verification code required" in str(e):
            code = input("Enter verification code received on your phone: ")
            try:
                await telegram_service.sign_in_with_code(code)
                logger.info("Successfully signed in!")
                # Restart the main function
                await main()
            except ValueError as e2:
                if "Two-step verification" in str(e2):
                    password = input("Enter your two-step verification password: ")
                    await telegram_service.sign_in_with_password(code, password)
                    logger.info("Successfully signed in with 2FA!")
                    # Restart the main function
                    await main()
                else:
                    logger.error(f"Authentication error: {e2}")
        else:
            logger.error(f"Error: {e}")
    except KeyboardInterrupt:
        logger.info("Stopping listener...")
    finally:
        # Clean up
        if 'listener_service' in locals():
            await listener_service.stop_all_listeners()
        if 'telegram_service' in locals():
            await telegram_service.disconnect()

if __name__ == "__main__":
    asyncio.run(main()) 