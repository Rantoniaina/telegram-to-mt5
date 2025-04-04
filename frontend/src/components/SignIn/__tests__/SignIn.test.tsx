import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignIn from '../SignIn';
import { useTranslation } from 'react-i18next';
import { TelegramCredentials } from '../../../types/telegram';
import { useAuth } from '../../../context/AuthContext';
import telegramService from '../../../services/telegramService';

// Mock the entire modules
jest.mock('../../../services/apiService', () => {
  class ApiError extends Error {
    status: number;
    data?: any;

    constructor(message: string, status: number, data?: any) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  return {
    ApiError,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      handleResponse: jest.fn(),
    },
  };
});

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock telegramService
const mockConnect = jest.fn();
jest.mock('../../../services/telegramService', () => ({
  connect: jest.fn(),
  submitVerificationCode: jest.fn(),
  getDialogs: jest.fn(),
  getMessages: jest.fn(),
  disconnect: jest.fn(),
  searchMessages: jest.fn(),
}));

// Import the mocked ApiError now that the mock is setup
import { ApiError } from '../../../services/apiService';

// Mock VerificationCode component
jest.mock('../../VerificationCode', () => {
  return function MockVerificationCode(props: any) {
    return (
      <div data-testid='verification-code-component'>
        <button data-testid='mock-success-button' onClick={props.onSuccess}>
          Success
        </button>
        <button data-testid='mock-back-button' onClick={props.onBack}>
          Back
        </button>
      </div>
    );
  };
});

// Mock LanguageSwitcher component to simplify tests
jest.mock('../../LanguageSwitcher', () => {
  return function DummyLanguageSwitcher() {
    return <div data-testid='language-switcher'>Language Switcher</div>;
  };
});

describe('SignIn Component', () => {
  // Translation mock implementation
  const tMock = jest.fn((key: string, options?: any) => {
    const translations: Record<string, string | string[]> = {
      'signIn.title': 'Sign In to Telegram',
      'signIn.description': 'Enter your Telegram API credentials',
      'signIn.tooltip.steps': [
        'Step 1: Create Telegram API credentials',
        'Step 2: Enter API ID and Hash',
        'Step 3: Enter phone number',
      ],
      'signIn.apiId.label': 'API ID',
      'signIn.apiId.placeholder': 'Enter your API ID',
      'signIn.apiId.error': 'API ID is required',
      'signIn.apiHash.label': 'API Hash',
      'signIn.apiHash.placeholder': 'Enter your API Hash',
      'signIn.apiHash.error': 'API Hash is required',
      'signIn.phone.label': 'Phone Number',
      'signIn.phone.placeholder': 'Enter your phone number',
      'signIn.phone.error': 'Phone number is required',
      'signIn.next': 'Next',
      'signIn.connectError': 'Failed to connect to Telegram',
      'signIn.connectSuccess': 'Connected successfully!',
    };
    const value = translations[key];
    if (Array.isArray(value) && options?.returnObjects) {
      return value;
    }
    return typeof value === 'string' ? value : key;
  });

  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup translation mock
    (useTranslation as jest.Mock).mockReturnValue({
      t: tMock,
      i18n: { changeLanguage: jest.fn() },
    });

    // Setup auth context mock
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      credentials: null,
      login: mockLogin,
      logout: jest.fn(),
    });

    // Setup default telegramService mock
    telegramService.connect = mockConnect;
    mockConnect.mockResolvedValue({
      success: true,
    });
  });

  test('renders sign in form', () => {
    render(<SignIn />);

    // Check title and description
    expect(screen.getByText('Sign In to Telegram')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your Telegram API credentials')
    ).toBeInTheDocument();

    // Check form fields
    expect(screen.getByLabelText(/API ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/API Hash/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();

    // Check button
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('validate form fields are required', () => {
    render(<SignIn />);

    // Get the button and simulate a click without filling fields
    const button = screen.getByText('Next');
    expect(button).toBeDisabled();

    // Connect should not be called
    expect(mockConnect).not.toHaveBeenCalled();
  });

  test('submits form with valid data and connects successfully', async () => {
    render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Next'));

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith({
        api_id: 12345,
        api_hash: 'test_hash',
        phone: '+1234567890',
      });
    });

    // Login should be called
    expect(mockLogin).toHaveBeenCalledWith({
      api_id: 12345,
      api_hash: 'test_hash',
      phone: '+1234567890',
    });
  });

  test('shows verification code component when verification is needed', async () => {
    // Mock response to indicate verification is needed
    mockConnect.mockResolvedValue({
      success: false,
      needs_verification: true,
    });

    const { container, rerender } = render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Next'));

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    // Force rerender to see updated component state
    rerender(<SignIn />);

    // Check if we're now in verification step (indirectly by checking if SignIn form is gone)
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  test('handles API errors', async () => {
    // Mock API error
    const errorMessage = 'Connection failed: invalid API credentials';
    mockConnect.mockRejectedValue(new ApiError(errorMessage, 400));

    render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Next'));

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  test('handles API error with verification code request', async () => {
    // Mock API error that should trigger verification
    const errorMessage = 'Please provide verification code';
    mockConnect.mockRejectedValue(
      new ApiError(errorMessage, 401, {
        detail: 'verification code',
      })
    );

    const { rerender } = render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Next'));

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    // Force rerender
    rerender(<SignIn />);

    // Should redirect to verification code
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  test('form validation works with partial data', () => {
    render(<SignIn />);

    // Fill in only API ID
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });

    // Next button should remain disabled
    expect(screen.getByText('Next')).toBeDisabled();
  });

  test('form validation when only API Hash is empty', () => {
    render(<SignIn />);

    // Fill in API ID and phone
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Next button should remain disabled
    expect(screen.getByText('Next')).toBeDisabled();
  });

  test('form validation when only Phone is empty', () => {
    render(<SignIn />);

    // Fill in API ID and API Hash
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });

    // Next button should remain disabled
    expect(screen.getByText('Next')).toBeDisabled();
  });

  test('handles form submission properly', async () => {
    render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Check that button is now enabled
    expect(screen.getByText('Next')).not.toBeDisabled();

    // Click the button
    fireEvent.click(screen.getByText('Next'));

    // Wait for API call to happen
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  test('handles Enter key to submit form', async () => {
    render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Press Enter key on the form
    const formContainer = screen
      .getByRole('button', { name: 'Next' })
      .closest('div');
    if (formContainer) {
      fireEvent.keyDown(formContainer, { key: 'Enter', code: 'Enter' });
    }

    // Wait for API call to happen
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  test('handles success state and close snackbar', async () => {
    render(<SignIn />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/API ID/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/API Hash/i), {
      target: { value: 'test_hash' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1234567890' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Next'));

    // Wait for success message to appear
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    // Since the mock returns success=true, we should see the success message
    const successAlert = await screen.findByText('Connected successfully!');
    expect(successAlert).toBeInTheDocument();

    // Find and click close button
    const closeButton = successAlert
      .closest('div')
      ?.querySelector('[aria-label="Close"]');
    if (closeButton) {
      fireEvent.click(closeButton);
    }
  });
});
