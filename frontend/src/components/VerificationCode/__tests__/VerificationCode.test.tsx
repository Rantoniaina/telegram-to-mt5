import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import VerificationCode from '../VerificationCode';
import { useTranslation } from 'react-i18next';
import { TelegramCredentials } from '../../../types/telegram';

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

// Mock telegramService
const mockSubmitVerificationCode = jest.fn();
jest.mock('../../../services/telegramService', () => ({
  submitVerificationCode: (...args: any[]) =>
    mockSubmitVerificationCode(...args),
}));

// Import the mocked ApiError now that the mock is setup
import { ApiError } from '../../../services/apiService';

// Mock LanguageSwitcher component to simplify tests
jest.mock('../../LanguageSwitcher', () => {
  return function DummyLanguageSwitcher() {
    return <div data-testid='language-switcher'>Language Switcher</div>;
  };
});

describe('VerificationCode Component', () => {
  const mockCredentials: TelegramCredentials = {
    api_id: 12345,
    api_hash: 'test_hash',
    phone: '+1234567890',
  };

  const mockOnSuccess = jest.fn();
  const mockOnBack = jest.fn();

  // Translation mock implementation
  const tMock = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'signIn.verificationTitle': 'Verification',
      'signIn.codePrompt': 'Enter the code sent to your device',
      'signIn.verificationCode.label': 'Verification Code',
      'signIn.password.label': 'Two-Step Verification Password',
      'signIn.verify': 'Verify',
      'common.back': 'Back',
      'signIn.verificationError': 'Verification failed',
      'signIn.passwordRequired': 'Password required for two-step verification',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup translation mock
    (useTranslation as jest.Mock).mockReturnValue({
      t: tMock,
      i18n: { changeLanguage: jest.fn() },
    });

    // Setup default telegramService mock
    mockSubmitVerificationCode.mockResolvedValue({
      success: true,
    });
  });

  // Helper function to get the verification code input element
  const getCodeInput = () => {
    return screen.getByRole('textbox');
  };

  // Helper function to get the password input when visible
  const getPasswordInput = () => {
    // Find all inputs, assuming the password is the second one
    const inputs = screen.getAllByRole('textbox');
    if (inputs.length > 1) {
      return inputs[1];
    }

    // If not found, try finding a password input
    try {
      return screen.getByRole('textbox', { name: /password/i });
    } catch (e) {
      // If still not found, try getting any password type input
      const passwordInputs = document.querySelectorAll(
        'input[type="password"]'
      );
      if (passwordInputs.length > 0) {
        return passwordInputs[0] as HTMLElement;
      }

      return null;
    }
  };

  test('renders verification code form', () => {
    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Check header and description are rendered
    expect(screen.getByText('Verification')).toBeInTheDocument();
    expect(
      screen.getByText('Enter the code sent to your device')
    ).toBeInTheDocument();

    // Check for form elements - using our helper and direct role queries
    expect(getCodeInput()).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();

    // Password field should not be visible initially
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBe(0);
  });

  test('verify button should be disabled when code is empty', () => {
    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    const verifyButton = screen.getByText('Verify');
    expect(verifyButton).toBeDisabled();
  });

  test('verify button should be enabled when code is entered', () => {
    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Button should be enabled
    const verifyButton = screen.getByText('Verify');
    expect(verifyButton).not.toBeDisabled();
  });

  test('back button should call onBack function', () => {
    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Click back button
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Check if onBack was called
    expect(mockOnBack).toHaveBeenCalled();
  });

  test('successful verification should call onSuccess', async () => {
    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Submit form
    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockSubmitVerificationCode).toHaveBeenCalledWith(
        mockCredentials,
        '12345',
        undefined
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test.skip('shows password field when two-step verification is required', async () => {
    // Mock response indicating 2FA is required
    mockSubmitVerificationCode.mockResolvedValue({
      success: false,
      needs_password: true,
    });

    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Submit form
    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    // Wait for password field to appear - check by finding password inputs directly
    await waitFor(() => {
      const passwordInputs = document.querySelectorAll(
        'input[type="password"]'
      );
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    // Button should be disabled again until password is entered
    expect(verifyButton).toBeDisabled();
  });

  test.skip('submits with password when two-step verification is required', async () => {
    // First response requires password
    mockSubmitVerificationCode
      .mockResolvedValueOnce({ success: false, needs_password: true })
      // Second response is successful
      .mockResolvedValueOnce({ success: true });

    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Submit form first time
    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    // Wait for password field to appear
    await waitFor(() => {
      const passwordInputs = document.querySelectorAll(
        'input[type="password"]'
      );
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    // Enter password
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    }

    // Button should be enabled again after filling password
    await waitFor(() => {
      expect(verifyButton).not.toBeDisabled();
    });

    // Submit form second time
    fireEvent.click(verifyButton);

    // Check second API call includes password
    await waitFor(() => {
      expect(mockSubmitVerificationCode).toHaveBeenLastCalledWith(
        mockCredentials,
        '12345',
        'password123'
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test.skip('displays error message when verification fails', async () => {
    // Mock API error
    const apiError = new ApiError('Verification code invalid', 400);
    mockSubmitVerificationCode.mockRejectedValue(apiError);

    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Submit form
    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    // Wait for error to be displayed in some way - we might need to look for alert role
    await waitFor(
      () => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert.textContent).toContain('Verification code invalid');
      },
      { timeout: 3000 }
    );

    // Success callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  test.skip('shows 2FA password field when API returns 401 with two-step message', async () => {
    // Mock API error indicating 2FA is required
    const apiError = new ApiError(
      'Please enter your two-step verification password',
      401
    );
    mockSubmitVerificationCode.mockRejectedValue(apiError);

    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Submit form
    const verifyButton = screen.getByText('Verify');
    fireEvent.click(verifyButton);

    // Wait for alert with the password message and a password field to appear
    await waitFor(
      () => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert.textContent).toContain(
          'Password required for two-step verification'
        );

        const passwordInputs = document.querySelectorAll(
          'input[type="password"]'
        );
        expect(passwordInputs.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  test('handles Enter key press to submit form', async () => {
    render(
      <VerificationCode
        credentials={mockCredentials}
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
      />
    );

    // Enter verification code
    const codeInput = getCodeInput();
    fireEvent.change(codeInput, { target: { value: '12345' } });

    // Press Enter key
    fireEvent.keyDown(codeInput.closest('div[onKeyDown]') || codeInput, {
      key: 'Enter',
    });

    // Wait for API call
    await waitFor(() => {
      expect(mockSubmitVerificationCode).toHaveBeenCalled();
    });
  });
});
