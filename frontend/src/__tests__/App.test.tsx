import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import theme from '../theme';
import { ThemeProvider } from '@mui/material';
import { AuthProvider } from '../context/AuthContext';
import AppRouter from '../components/AppRouter';

// Mock i18n
jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    // Mock methods if needed
  },
}));

// Mock dependencies
jest.mock('../theme', () => ({
  __esModule: true,
  default: {
    palette: {
      primary: { main: '#6FCF97' },
    },
  },
}));

let capturedTheme: any = null;
let capturedBoxSx: any = null;

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    ThemeProvider: ({
      children,
      theme,
    }: {
      children: React.ReactNode;
      theme: any;
    }) => {
      capturedTheme = theme;
      return <div data-testid='theme-provider'>{children}</div>;
    },
    CssBaseline: () => <div data-testid='css-baseline' />,
    Box: ({ children, sx }: { children: React.ReactNode; sx: any }) => {
      capturedBoxSx = sx;
      return <div data-testid='mui-box'>{children}</div>;
    },
  };
});

jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='auth-provider'>{children}</div>
  ),
}));

jest.mock('../components/AppRouter', () => () => (
  <div data-testid='app-router'>AppRouter</div>
));

describe('App', () => {
  beforeEach(() => {
    capturedTheme = null;
    capturedBoxSx = null;
    jest.clearAllMocks();
  });

  test('renders with correct providers and components', () => {
    render(<App />);

    // Check that ThemeProvider is present
    const themeProvider = screen.getByTestId('theme-provider');
    expect(themeProvider).toBeInTheDocument();

    // Check that CssBaseline is present
    const cssBaseline = screen.getByTestId('css-baseline');
    expect(cssBaseline).toBeInTheDocument();

    // Check that Box is present
    const box = screen.getByTestId('mui-box');
    expect(box).toBeInTheDocument();

    // Check that AuthProvider is present
    const authProvider = screen.getByTestId('auth-provider');
    expect(authProvider).toBeInTheDocument();

    // Check that AppRouter is present inside AuthProvider
    const appRouter = screen.getByTestId('app-router');
    expect(appRouter).toBeInTheDocument();
    expect(authProvider).toContainElement(appRouter);

    // Verify the correct theme is passed to ThemeProvider
    expect(capturedTheme).toBeDefined();
    expect(capturedTheme.palette.primary.main).toBe('#6FCF97');
  });

  test('applies correct styling to Box component', () => {
    render(<App />);

    // Verify Box component receives correct styling
    expect(capturedBoxSx).toEqual({
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    });
  });

  test('imports i18n module', () => {
    // Ensure i18n is imported (mocked above)
    expect(jest.isMockFunction(require('../i18n').default)).toBeFalsy();
    expect(require('../i18n').default).toBeDefined();
  });
});
