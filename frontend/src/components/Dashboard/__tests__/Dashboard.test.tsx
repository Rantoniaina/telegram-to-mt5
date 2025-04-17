import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useAuth } from '../../../context/AuthContext';
import '@testing-library/jest-dom/extend-expect';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';

// Manual mocks
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock('../../../services/telegramService', () => ({
  getDialogs: jest.fn(),
  disconnect: jest.fn(),
}));

// Import telegramService after mocking
import telegramService from '../../../services/telegramService';

describe('Dashboard Component', () => {
  const mockCredentials = {
    api_id: 12345,
    api_hash: 'test_hash',
    phone: '+1234567890',
  };

  const mockLogout = jest.fn();
  const mockDialogs = [
    { id: 1, name: 'Chat 1', type: 'private', entity_id: 101, unread_count: 0 },
    { id: 2, name: 'Group 1', type: 'group', entity_id: 201, unread_count: 3 },
  ];

  const renderWithProviders = (component: React.ReactNode) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth context mock
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      credentials: mockCredentials,
      logout: mockLogout,
    });

    // Setup telegram service mock
    (telegramService.getDialogs as jest.Mock).mockResolvedValue(mockDialogs);
    (telegramService.disconnect as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  test('renders dashboard with the correct title', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Telegram to MT5')).toBeInTheDocument();
  });

  test('initially shows loading state for dialogs', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('loads and displays dialog count', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('You have access to 2 Telegram dialogs')
      ).toBeInTheDocument();
    });

    expect(telegramService.getDialogs).toHaveBeenCalledWith(mockCredentials);
  });

  test('shows connected API ID information', () => {
    renderWithProviders(<Dashboard />);
    expect(
      screen.getByText('Connected with API ID: 12345')
    ).toBeInTheDocument();
  });

  test('switches to MetaTrader section when clicked', () => {
    renderWithProviders(<Dashboard />);

    // Initially on dashboard section
    expect(screen.getByText('Welcome to T2M Dashboard')).toBeInTheDocument();

    // Click on MetaTrader navigation item
    fireEvent.click(screen.getByText('Metatrader 5 Sync'));

    // Should show MetaTrader content
    expect(
      screen.getByRole('heading', { name: 'Metatrader 5 Sync' })
    ).toBeInTheDocument();
  });

  test('switches to Settings section when clicked', () => {
    renderWithProviders(<Dashboard />);

    // Click on Settings navigation item
    fireEvent.click(screen.getByText('Settings'));

    // Should show Settings content
    expect(
      screen.getByRole('heading', { name: 'Settings' })
    ).toBeInTheDocument();
  });

  test('opens user menu when avatar is clicked', () => {
    renderWithProviders(<Dashboard />);

    // Menu should be closed initially
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    // Click on the avatar button
    const avatarButton = screen.getByRole('button', { name: /user avatar/i });
    fireEvent.click(avatarButton);

    // Menu should be open with logout option
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls logout function when logout option is clicked', async () => {
    renderWithProviders(<Dashboard />);

    // Open the menu
    const avatarButton = screen.getByRole('button', { name: /user avatar/i });
    fireEvent.click(avatarButton);

    // Click on logout
    fireEvent.click(screen.getByText('Logout'));

    // Should call disconnect and logout
    expect(telegramService.disconnect).toHaveBeenCalledWith(mockCredentials);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  test('handles create card click in MetaTrader section', () => {
    // Mock console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    renderWithProviders(<Dashboard />);

    // Navigate to MetaTrader section
    fireEvent.click(screen.getByText('Metatrader 5 Sync'));

    // Click on Create card
    fireEvent.click(screen.getAllByText('Create')[1]); // The second "Create" text is in the card

    // Should log the action
    expect(consoleSpy).toHaveBeenCalledWith('Create card clicked');

    consoleSpy.mockRestore();
  });

  test('handles error when fetching dialogs', async () => {
    // Setup error case
    (telegramService.getDialogs as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch dialogs:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test('handles error when disconnecting from Telegram', async () => {
    // Setup error case
    (telegramService.disconnect as jest.Mock).mockRejectedValue(
      new Error('Failed to disconnect')
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderWithProviders(<Dashboard />);

    // Open the menu
    const avatarButton = screen.getByRole('button', { name: /user avatar/i });
    fireEvent.click(avatarButton);

    // Click on logout
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error disconnecting from Telegram:',
        expect.any(Error)
      );
    });

    // Should still call logout even if disconnect fails
    expect(mockLogout).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('renders sidebar with navigation items', () => {
    renderWithProviders(<Dashboard />);
    expect(
      screen.getByRole('button', { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /metatrader/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /settings/i })
    ).toBeInTheDocument();
  });

  test('renders user avatar', () => {
    renderWithProviders(<Dashboard />);
    expect(
      screen.getByRole('img', { name: /user avatar/i })
    ).toBeInTheDocument();
  });

  test('opens user menu when avatar is clicked', () => {
    renderWithProviders(<Dashboard />);
    const avatar = screen.getByRole('img', { name: /user avatar/i });
    fireEvent.click(avatar);
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  test('changes active section when navigation items are clicked', () => {
    renderWithProviders(<Dashboard />);

    // Click MetaTrader section
    fireEvent.click(screen.getByRole('button', { name: /metatrader/i }));
    expect(
      screen.getByRole('heading', { name: 'Metatrader 5 Sync' })
    ).toBeInTheDocument();

    // Click Settings section
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(
      screen.getByRole('heading', { name: 'Settings' })
    ).toBeInTheDocument();

    // Click Dashboard section
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(
      screen.getByRole('heading', { name: 'Welcome to T2M Dashboard' })
    ).toBeInTheDocument();
  });
});
