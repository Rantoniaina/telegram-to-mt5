# 🚀 Telegram to MT5 Frontend

This project is a modern React application built with TypeScript and Vite that serves as the frontend for the Telegram to MT5 integration.

## ✨ Features

- 🔒 User authentication system with verification
- 🌍 Internationalization support with i18next
- 🎨 Material UI components with custom theming
- 📱 Responsive design
- ✅ Testing setup with Jest and React Testing Library

## 🛠️ Tech Stack

- **Framework**: React 17
- **UI Library**: Material UI
- **Styling**: Emotion
- **State Management**: React Context API
- **Internationalization**: i18next
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
4. Copy the environment file and configure it:
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview the production build locally
- `npm run test` - Run Jest tests

## 🔧 Project Structure

```
src/
  ├── assets/           # Static assets like images
  ├── components/       # Reusable UI components
  ├── context/          # React Context providers
  ├── i18n/             # Internationalization configuration
  ├── services/         # API service functions
  ├── types/            # TypeScript type definitions
  ├── __tests__/        # Test files
  ├── App.tsx           # Main application component
  ├── main.tsx          # Application entry point
  ├── theme.ts          # Material UI theme configuration
  └── index.css         # Global styles
```

## 🧩 ESLint Configuration

This project uses ESLint for code quality. For production applications, it's recommended to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    // For stricter rules, use:
    // ...tseslint.configs.strictTypeChecked,
    // For stylistic rules, add:
    // ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```
