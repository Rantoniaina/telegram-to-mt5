# 🚀 Telegram to MT5 Integration

This project connects Telegram to MetaTrader 5 (MT5), allowing you to access and analyze Telegram messages and integrate them with trading platforms.

## 🏗️ Project Architecture

The application consists of two main parts:

1. **📱 Frontend**: React application providing the user interface
2. **⚙️ Backend**: Python FastAPI service for Telegram API integration

## ✨ Key Features

- 🔒 User authentication system with verification
- 💬 Access Telegram messages, channels, and groups
- 🌍 Multi-language support with i18next
- 📊 Integration with MetaTrader 5
- 🎨 Modern UI with Material UI components
- 📱 Responsive design for all devices
- 💾 Local data storage for improved performance

## 🔧 Technical Stack

### Frontend

- **Framework**: React 17
- **UI Library**: Material UI with Emotion styling
- **State Management**: React Context API
- **Internationalization**: i18next
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **Language**: TypeScript

### Backend

- **Framework**: FastAPI (Python)
- **Telegram API**: Telethon library
- **Database**: SQLAlchemy with SQLite
- **Authentication**: Token-based

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14+)
- Python 3.7+
- Telegram API credentials (API ID and hash)

### Quick Start

The easiest way to get started is to use the provided initialization script:

```bash
./init.sh
```

This script will:

- Set up the Python virtual environment for the backend
- Install all required dependencies
- Start both the backend and frontend servers
- Handle cleanup when terminated (Ctrl+C)

### Manual Setup

#### Frontend Setup

1. Navigate to the frontend directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and configure:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

#### Backend Setup

1. Navigate to the backend directory
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
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

4. Run the server:
   ```bash
   python backend/run.py
   ```

## 📝 Available Scripts

### Project-wide

- `./init.sh` - Initialize and start both backend and frontend servers

### Frontend

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run test` - Run tests

### Backend

- `python backend/run.py` - Run the API server
- `python -m app.main` - Alternative way to run the server

## 📚 API Documentation

The backend API documentation is available at http://localhost:8000/docs when running the server.

### Common API Endpoints

1. **Connect to Telegram**:

   ```bash
   POST /v1/telegram/connect
   ```

2. **Get Dialogs (Chats, Channels, Groups)**:

   ```bash
   POST /v1/telegram/dialogs
   ```

3. **Get Messages**:

   ```bash
   POST /v1/telegram/messages/{dialog_id}
   ```

4. **Search Messages**:
   ```bash
   POST /v1/telegram/search
   ```

## 🔒 Security Considerations

- Store API credentials securely
- Restrict CORS origins in production
- Consider implementing robust authentication
- Use a production-ready database in production environments

## 📁 Project Structure

### Frontend Structure

```
frontend/src/
  ├── assets/           # Static assets
  ├── components/       # UI components
  │   ├── AppRouter/    # Navigation components
  │   ├── Background/   # Background components
  │   ├── Dashboard/    # Dashboard UI
  │   ├── LanguageSwitcher/ # Language selection
  │   ├── SignIn/       # Authentication UI
  │   └── VerificationCode/ # Verification UI
  ├── context/          # React Context providers
  ├── i18n/             # Internationalization
  ├── services/         # API services
  ├── types/            # TypeScript types
  ├── __tests__/        # Test files
  ├── App.tsx           # Main component
  └── main.tsx          # Entry point
```

### Backend Structure

```
backend/
├── app/                # Main application
│   ├── api/            # API endpoints
│   ├── config/         # Configuration
│   ├── core/           # Core functionality
│   ├── models/         # Database models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   └── main.py         # Entry point
└── db/                 # Database files
```

## 📧 Contact & Support

For issues or feature requests, please use the issue tracker on the repository.

# Telegram Message Listener

This project provides a service to connect to Telegram and retrieve or listen for messages in real-time.

## Features

- Connect to Telegram using official API
- Retrieve message history from chats, groups, and channels
- Search for specific messages
- Listen for new messages in real-time
- Handle authentication including 2FA

## Setup

1. **Get Telegram API Credentials**

   - Visit https://my.telegram.org/auth
   - Log in with your phone number
   - Go to "API development tools"
   - Create a new application
   - Note down your `api_id` and `api_hash`

2. **Install Dependencies**

   ```bash
   pip install telethon python-dotenv
   ```

3. **Configure Environment**
   Create a `.env` file in the project root with:
   ```
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   TELEGRAM_PHONE=your_phone_number  # with country code
   ```

## Usage

### Listening for New Messages

Run the example script:

```bash
python examples/listen_for_messages.py
```

When connecting for the first time, you'll need to enter the verification code sent to your Telegram app. If you have two-factor authentication enabled, you'll also need to enter your password.

### Using in Your Own Code

```python
import asyncio
from backend.app.services.telegram_service import TelegramService

async def message_handler(message_info):
    print(f"New message: {message_info['text']}")

async def main():
    # Create the TelegramService instance
    service = TelegramService(
        api_id=YOUR_API_ID,
        api_hash="YOUR_API_HASH",
        phone="YOUR_PHONE_NUMBER"
    )

    await service.connect()

    # To get a list of all dialogs
    dialogs = await service.get_all_dialogs()
    print(dialogs)

    # To listen for new messages in specific dialogs
    await service.listen_for_new_messages(
        dialog_ids=[123456789],  # optional, None for all dialogs
        callback=message_handler
    )

    # Don't forget to disconnect when done
    await service.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
```

## License

MIT

## 🆕 Telegram Message Sync Service

This project includes a service to continuously listen for and store messages from multiple Telegram chats simultaneously.

### Key Features of the Sync Service

- 🔄 Run multiple Telegram listeners simultaneously
- 💾 Configure different output types (database, file, etc.)
- 🌐 REST API to manage sync configurations
- 🕒 Automatic reconnection and monitoring
- 📊 Track message history in the database

### Using the Sync Service

The sync service is accessible through API endpoints:

```bash
# List all sync configurations
GET /v1/sync/

# Create a new sync configuration
POST /v1/sync/
```

### Creating a Sync Configuration

You can create a new sync configuration using the API:

```bash
curl -X POST "http://localhost:8000/v1/sync/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "discussion_name": "My Important Channel",
    "state": "active"
  }'
```

Or use the Swagger UI at http://localhost:8000/docs

### Managing Sync Configurations

The following API endpoints are available:

- `GET /v1/sync/` - List all sync configurations
- `POST /v1/sync/` - Create a new sync configuration
- `GET /v1/sync/{sync_id}` - Get a specific configuration
- `PUT /v1/sync/{sync_id}` - Update a configuration
- `DELETE /v1/sync/{sync_id}` - Delete a configuration
- `PUT /v1/sync/{sync_id}/state/{state}` - Update a sync's state

### Accessing Synced Messages

Synced messages are stored in the database and can be accessed via SQL queries or your preferred ORM.

If you configured file output, messages will also be saved to the specified file path.
