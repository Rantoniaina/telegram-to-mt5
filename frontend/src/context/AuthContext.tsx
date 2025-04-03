import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { TelegramCredentials } from '../types/telegram';

interface AuthContextType {
  isAuthenticated: boolean;
  credentials: TelegramCredentials | null;
  login: (userCredentials: TelegramCredentials) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'telegram_auth_credentials';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<TelegramCredentials | null>(
    null
  );

  // Load credentials from localStorage on initial mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setCredentials(parsedAuth);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored credentials', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const login = (userCredentials: TelegramCredentials) => {
    setCredentials(userCredentials);
    setIsAuthenticated(true);
    // Store credentials in localStorage for persistence
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userCredentials));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    // Remove credentials from localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, credentials, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
