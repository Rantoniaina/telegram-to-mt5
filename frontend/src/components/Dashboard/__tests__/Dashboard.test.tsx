import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useAuth } from '../../../context/AuthContext';
import '@testing-library/jest-dom/extend-expect';

// Manual mocks
jest.mock('../../../context/AuthContext');
jest.mock('../../../services/telegramService', () => ({
  getDialogs: jest.fn(),
  disconnect: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'app.name': 'Telegram to MT5',
        'dashboard.welcome': 'Welcome to Dashboard',
        'dashboard.telegram.loading': 'Loading dialogs...',
        'dashboard.telegram.dialogsCount': `You have ${
          options?.count || 0
        } dialogs`,
        'dashboard.telegram.connected': `Connected with API ID: ${
          options?.apiId || ''
        }`,
        'common.dashboard': 'Dashboard',
        'common.create': 'Create',
        'common.logout': 'Logout',
        'settings.title': 'Settings',
        'settings.description': 'Manage your settings here',
        'metatrader.title': 'MetaTrader',
        'metatrader.description': 'Connect and manage your MetaTrader accounts',
      };
      return translations[key] || key;
    },
  }),
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
    render(<Dashboard />);
    expect(screen.getByText('Telegram to MT5')).toBeInTheDocument();
  });

  test('initially shows loading state for dialogs', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading dialogs...')).toBeInTheDocument();
  });

  test('loads and displays dialog count', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('You have 2 dialogs')).toBeInTheDocument();
    });

    expect(telegramService.getDialogs).toHaveBeenCalledWith(mockCredentials);
  });

  test('shows connected API ID information', () => {
    render(<Dashboard />);
    expect(
      screen.getByText('Connected with API ID: 12345')
    ).toBeInTheDocument();
  });

  test('switches to MetaTrader section when clicked', () => {
    render(<Dashboard />);

    // Initially on dashboard section
    expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();

    // Click on MetaTrader navigation item
    fireEvent.click(screen.getByText('MetaTrader'));

    // Should show MetaTrader content
    expect(
      screen.getByText('Connect and manage your MetaTrader accounts')
    ).toBeInTheDocument();
  });

  test('switches to Settings section when clicked', () => {
    render(<Dashboard />);

    // Click on Settings navigation item
    fireEvent.click(screen.getByText('Settings'));

    // Should show Settings content
    expect(screen.getByText('Manage your settings here')).toBeInTheDocument();
  });

  test('opens user menu when avatar is clicked', () => {
    render(<Dashboard />);

    // Menu should be closed initially
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    // Click on the avatar button
    const avatarButton = screen.getByRole('button', { name: /user avatar/i });
    fireEvent.click(avatarButton);

    // Menu should be open with logout option
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls logout function when logout option is clicked', async () => {
    render(<Dashboard />);

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

    render(<Dashboard />);

    // Navigate to MetaTrader section
    fireEvent.click(screen.getByText('MetaTrader'));

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

    render(<Dashboard />);

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

    render(<Dashboard />);

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
});
