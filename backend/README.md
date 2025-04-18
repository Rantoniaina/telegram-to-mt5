# 📱 Telegram API Service

A RESTful API service that connects to Telegram using API credentials and retrieves discussions, messages, and other data. Stores session data for better performance.

## 🗂️ Project Structure

```
backend/
├── app/                 # Main application package
│   ├── api/             # API endpoints
│   │   ├── v1/          # API version 1
│   │   │   ├── router.py    # Main API router
│   │   │   ├── telegram.py  # Telegram endpoints
│   │   │   └── db.py        # Database endpoints
│   ├── config/          # Configuration
│   │   └── settings.py  # App settings
│   ├── core/            # Core functionality
│   │   ├── app_factory.py  # FastAPI app factory
│   │   ├── database.py     # Database connection
│   │   └── compat.py       # Compatibility fixes
│   ├── models/          # SQLAlchemy models
│   │   └── telegram_data.py  # Telegram data models
│   ├── schemas/         # Pydantic models
│   │   └── telegram.py  # Telegram schemas
│   ├── services/        # Business logic services
│   │   ├── telegram_service.py  # Telegram service
│   │   ├── listener_service.py  # Telegram message listener
│   │   └── db_service.py        # Database service
│   └── main.py          # Application entry point
├── db/                  # Database files
│   └── app.db           # SQLite database
├── requirements.txt     # Dependencies
├── requirements-test.txt  # Testing dependencies
└── run.py               # Script to run the server
```

## ✨ Features

- 🔑 Connect to Telegram using API ID and API hash
- 💬 Retrieve all dialogs (chats, channels, groups)
- 📨 Get messages from specific dialogs
- 🔍 Search for messages across dialogs
- 🔔 Real-time message listener for channels/chats
- 📱 Verification code and 2FA password support
- 💾 Session management for multiple clients
- 🗄️ Store data in SQLite database
- 🌐 WebSocket API for real-time message updates

## 📋 Requirements

- Python 3.7+
- Telethon library for Telegram API access
- FastAPI for the REST API
- SQLAlchemy for database operations
- Other dependencies listed in `requirements.txt`

## 🚀 Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Get your Telegram API credentials:

   - Go to https://my.telegram.org/
   - Log in with your phone number
   - Create a new application to get your API ID and API hash

3. Create a `.env` file with your configuration:

```
# Telegram API Settings (Optional - can be provided via API)
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_PHONE=

# API Settings
PORT=8000
HOST=0.0.0.0
DEBUG=True
```

## 🏃‍♂️ Running the API Server

```bash
# Method 1: Run directly
python backend/run.py

# Method 2: Run with module path
python -m app.main
```

The server will start on http://localhost:8000 by default. You can access the interactive API documentation at http://localhost:8000/docs.

## 🎧 Using the Message Listener

The project includes a dedicated listener service that continuously monitors for new messages in specified Telegram channels or chats:

```bash
# Listen for new messages in a specific dialog
python backend/listen.py -d 123456789
```

You can also use the `TelegramListenerService` programmatically:

```python
import asyncio
from app.services import TelegramService, TelegramListenerService

async def message_handler(message):
    print(f"New message: {message.text}")

async def main():
    # Initialize the Telegram service
    telegram_service = TelegramService(
        api_id=12345,
        api_hash="your_api_hash",
        phone="+1234567890"
    )

    # Connect to Telegram
    await telegram_service.connect()

    # Create the listener service
    listener = TelegramListenerService(telegram_service)

    # Start listening to a dialog
    await listener.start_listening(123456789, message_handler)

    # Keep running until Ctrl+C
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        # Clean up
        await listener.stop_all_listeners()
        await telegram_service.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

## 🌐 Real-Time Message Updates with WebSocket API

The API provides a WebSocket endpoint for real-time message updates from Telegram channels or chats. This allows your frontend to display new messages as they arrive without polling.

### WebSocket Connection

Connect to the WebSocket endpoint:
```

ws://localhost:8000/v1/ws/messages

````

After connecting, subscribe to specific dialogs by sending a JSON message:
```json
{
  "action": "subscribe",
  "dialog_id": 123456789
}
````

You will receive new messages in real-time:

```json
{
  "event": "new_message",
  "dialog_id": 123456789,
  "message": {
    "id": 123,
    "text": "Message content",
    "date": "2023-07-01T12:34:56+00:00",
    "sender": {
      "id": 987654321,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe"
    },
    "has_media": false
  }
}
```

### Example HTML/JS Client

An example HTML client is provided in `backend/examples/websocket_client.html`. Open this file in a browser to test the WebSocket API.

## 🔌 API Usage

### 1. Connect to Telegram

```bash
curl -X POST http://localhost:8000/v1/telegram/connect \
  -H "Content-Type: application/json" \
  -d '{"api_id": 123456, "api_hash": "your_api_hash", "phone": "+1234567890"}'
```

### 2. Verify Code (if required)

```bash
curl -X POST http://localhost:8000/v1/telegram/verify_code \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {"api_id": 123456, "api_hash": "your_api_hash", "phone": "+1234567890"},
    "code": "12345",
    "password": "your_2fa_password"  # Optional, only if 2FA is enabled
  }'
```

### 3. Get Dialogs (Chats, Channels, Groups)

```bash
curl -X POST http://localhost:8000/v1/telegram/dialogs \
  -H "Content-Type: application/json" \
  -d '{"api_id": 123456, "api_hash": "your_api_hash"}'
```

### 4. Get Messages from a Dialog

```bash
curl -X POST "http://localhost:8000/v1/telegram/messages/12345?limit=50" \
  -H "Content-Type: application/json" \
  -d '{"api_id": 123456, "api_hash": "your_api_hash"}'
```

### 5. Search Messages

```bash
curl -X POST http://localhost:8000/v1/telegram/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "search term",
    "dialog_ids": [12345, 67890],
    "limit": 50,
    "credentials": {"api_id": 123456, "api_hash": "your_api_hash"}
  }'
```

### 6. Disconnect from Telegram

```bash
curl -X POST http://localhost:8000/v1/telegram/disconnect \
  -H "Content-Type: application/json" \
  -d '{"api_id": 123456, "api_hash": "your_api_hash"}'
```

## 🧪 Testing

This project includes comprehensive test coverage for critical components including the WebSocket implementation, Telegram service, and database operations.

### Running Tests

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run specific test files
pytest tests/test_websocket.py tests/test_websocket_endpoints.py

# Generate coverage report
pytest --cov=app --cov-report=term-missing
```

For detailed information about test coverage and writing new tests, see the [tests/README.md](tests/README.md) file.

## 🔒 Security Notes

- Store your API credentials securely
- In production, restrict CORS origins in the API configuration
- Consider implementing proper authentication for the API endpoints
- The application uses SQLite by default; consider using a more robust database for production

## 🔄 Sync Service

The backend includes a sync service that allows tracking and managing syncs for Telegram messages. This service is exposed through the API endpoints and uses the database to store sync configurations.

### Sync API Endpoints

- `GET /v1/sync/` - List all syncs
- `GET /v1/sync/user/{user_id}` - Get all syncs for a specific user
- `GET /v1/sync/state/{state}` - Get all syncs with a specific state
- `GET /v1/sync/{sync_id}` - Get a specific sync
- `POST /v1/sync/` - Create a new sync
- `PUT /v1/sync/{sync_id}` - Update a sync
- `PUT /v1/sync/{sync_id}/state/{state}` - Update a sync's state
- `DELETE /v1/sync/{sync_id}` - Delete a sync

### Using the Sync Service Programmatically

```python
from app.services import SyncService
from app.models.sync import SyncState
from sqlalchemy.orm import Session

# Initialize the sync service with a database session
sync_service = SyncService(db_session)

# Create a new sync
sync = sync_service.create_sync(
    user_id=1,
    discussion_name="Important Channel",
    state=SyncState.ACTIVE
)

# Get all active syncs
active_syncs = sync_service.get_syncs_by_state(SyncState.ACTIVE)

# Update a sync's state
sync_service.update_sync_state(sync_id=1, state=SyncState.PAUSED)
```
