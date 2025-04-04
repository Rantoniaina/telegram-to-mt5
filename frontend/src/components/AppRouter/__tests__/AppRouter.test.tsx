import { render, screen } from '@testing-library/react';
import { useAuth } from '../../../context/AuthContext';
import AppRouter from '../AppRouter';

// Mock dependencies
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid='mock-dashboard'>Dashboard Component</div>;
  };
});

jest.mock('../../SignIn', () => {
  return function MockSignIn() {
    return <div data-testid='mock-signin'>SignIn Component</div>;
  };
});

jest.mock('../../Background', () => {
  return function MockBackground({ children }: { children: React.ReactNode }) {
    return (
      <div data-testid='mock-background'>
        <div>Background Component</div>
        {children}
      </div>
    );
  };
});

describe('AppRouter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Dashboard when user is authenticated', () => {
    // Mock authentication state to be authenticated
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<AppRouter />);

    // Dashboard should be visible
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();

    // SignIn and Background should not be in the document
    expect(screen.queryByTestId('mock-signin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-background')).not.toBeInTheDocument();
  });

  test('renders SignIn within Background when user is not authenticated', () => {
    // Mock authentication state to be not authenticated
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(<AppRouter />);

    // SignIn and Background should be visible
    expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
    expect(screen.getByTestId('mock-background')).toBeInTheDocument();

    // Dashboard should not be in the document
    expect(screen.queryByTestId('mock-dashboard')).not.toBeInTheDocument();
  });

  test('correctly uses AuthContext to determine rendered component', () => {
    // First render with authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    const { unmount } = render(<AppRouter />);
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();

    // Unmount and rerender with unauthenticated state
    unmount();

    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(<AppRouter />);
    expect(screen.getByTestId('mock-background')).toBeInTheDocument();
    expect(screen.getByTestId('mock-signin')).toBeInTheDocument();
  });
});
