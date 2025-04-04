import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { TelegramCredentials } from '../../types/telegram';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Custom hook testing utility
function renderAuthHook() {
  const result = { current: {} as any };

  function TestComponent() {
    const auth = useAuth();
    result.current = auth;
    return null;
  }

  const wrapper = render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  return { result, wrapper };
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
  });

  test('provides initial unauthenticated state', () => {
    const { result } = renderAuthHook();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.credentials).toBe(null);
  });

  test('login updates the authentication state and stores credentials', () => {
    const { result } = renderAuthHook();

    const mockCredentials: TelegramCredentials = {
      api_id: 12345,
      api_hash: 'mock_api_hash',
      phone: '+1234567890',
    };

    act(() => {
      result.current.login(mockCredentials);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.credentials).toEqual(mockCredentials);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'telegram_auth_credentials',
      JSON.stringify(mockCredentials)
    );
  });

  test('logout clears the authentication state and removes credentials', () => {
    const { result } = renderAuthHook();

    const mockCredentials: TelegramCredentials = {
      api_id: 12345,
      api_hash: 'mock_api_hash',
    };

    act(() => {
      result.current.login(mockCredentials);
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.credentials).toBe(null);
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'telegram_auth_credentials'
    );
  });

  test('loads credentials from sessionStorage on initial mount', () => {
    const mockCredentials: TelegramCredentials = {
      api_id: 12345,
      api_hash: 'mock_api_hash',
    };

    mockSessionStorage.getItem.mockReturnValueOnce(
      JSON.stringify(mockCredentials)
    );

    const { result } = renderAuthHook();

    expect(mockSessionStorage.getItem).toHaveBeenCalledWith(
      'telegram_auth_credentials'
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.credentials).toEqual(mockCredentials);
  });

  test('handles invalid data in sessionStorage', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Set invalid JSON in the storage
    mockSessionStorage.getItem.mockReturnValueOnce('invalid-json');

    const { result } = renderAuthHook();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
      'telegram_auth_credentials'
    );
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.credentials).toBe(null);

    consoleErrorSpy.mockRestore();
  });

  test('useAuth hook throws error when used outside AuthProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestWithoutProvider />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});

// Component for testing error when used outside provider
function TestWithoutProvider() {
  useAuth();
  return null;
}
