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

### Frontend Setup

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

### Backend Setup

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
