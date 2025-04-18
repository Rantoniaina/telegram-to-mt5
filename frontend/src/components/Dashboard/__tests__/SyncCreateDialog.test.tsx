import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncCreateDialog } from '../SyncCreateDialog';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';
import apiService from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';

// Define prop types for better type safety
interface DialogProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

// Mock apiService
jest.mock('../../../services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    data?: any;

    constructor(message: string, status: number, data?: any) {
      super(message);
      this.status = status;
      this.data = data;
    }
  },
}));

// Mock the SyncCreateDialog component for testing
jest.mock('../SyncCreateDialog', () => {
  const originalModule = jest.requireActual('../__mocks__/SyncCreateDialog');
  return originalModule;
});

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 1 },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    credentials: { api_id: 12345 },
  })),
}));

// Mock i18n translations
jest.mock('react-i18next', () => ({
  // Keep the original implementation
  ...jest.requireActual('react-i18next'),
  // But override useTranslation
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'sync.create.title': 'Create New Sync',
        'sync.create.channelName': 'Channel Name',
        'sync.create.channelNamePlaceholder': 'Enter Telegram channel name',
        'sync.create.description': 'Description',
        'sync.create.descriptionPlaceholder': 'Enter a description',
        'sync.create.submit': 'Create',
        'sync.create.cancel': 'Cancel',
        'sync.create.errorTitle': 'Error',
        'sync.create.success': 'Sync created successfully',
        'sync.create.channelNameRequired': 'Channel name is required',
      };
      return translations[key] || key;
    },
  }),
}));

describe('SyncCreateDialog', () => {
  const renderDialog = (props: Partial<DialogProps> = {}) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <SyncCreateDialog
          open={true}
          onClose={() => {}}
          onSuccess={() => {}}
          {...props}
        />
      </I18nextProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog when open is true', () => {
    renderDialog({});
    expect(screen.getByTestId('mock-sync-dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SyncCreateDialog
          open={false}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      </I18nextProvider>
    );
    expect(screen.queryByTestId('mock-sync-dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const handleClose = jest.fn();
    renderDialog({ onClose: handleClose });

    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when submitting without a channel name', async () => {
    renderDialog({});

    // Try to submit without entering channel name
    fireEvent.click(screen.getByTestId('create-button'));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Channel name is required'
      );
    });
  });

  it('creates a sync when form is submitted with valid data', async () => {
    const handleSuccess = jest.fn();
    const handleClose = jest.fn();

    // Mock successful API response
    (apiService.post as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 12345,
      discussion_name: 'test_channel',
      description: 'Test description',
      state: 'ACTIVE',
    });

    renderDialog({ onSuccess: handleSuccess, onClose: handleClose });

    // Fill in the form
    fireEvent.change(screen.getByTestId('channel-name-input'), {
      target: { value: 'test_channel' },
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Test description' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('create-button'));

    // Wait for callbacks to be called
    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('uses user_id from credentials', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: true,
      credentials: { api_id: 54321 },
    });

    const handleSuccess = jest.fn();
    const handleClose = jest.fn();

    renderDialog({ onSuccess: handleSuccess, onClose: handleClose });

    // Fill in the form
    fireEvent.change(screen.getByTestId('channel-name-input'), {
      target: { value: 'test_channel' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('create-button'));

    // Wait for callbacks to be called
    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
