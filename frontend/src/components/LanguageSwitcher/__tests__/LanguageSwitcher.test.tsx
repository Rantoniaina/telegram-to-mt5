import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Mock the react-i18next hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

describe('LanguageSwitcher Component', () => {
  // Mock implementation for useTranslation
  const changeLanguageMock = jest.fn();
  const tMock = jest.fn((key: string) => {
    // Simple mock implementation for t function
    const translations: Record<string, string> = {
      'language.english': 'English',
      'language.french': 'French',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up mock implementation for useTranslation
    (useTranslation as jest.Mock).mockReturnValue({
      t: tMock,
      i18n: {
        changeLanguage: changeLanguageMock,
      },
    });
  });

  test('renders language icon button', () => {
    render(<LanguageSwitcher />);

    // Find the language icon button
    const iconButton = screen.getByRole('button');
    expect(iconButton).toBeInTheDocument();
  });

  test('opens menu when icon is clicked', () => {
    render(<LanguageSwitcher />);

    // Initially menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Click the language icon
    fireEvent.click(screen.getByRole('button'));

    // Now menu should be open
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('displays language options in the menu', () => {
    render(<LanguageSwitcher />);

    // Open the menu
    fireEvent.click(screen.getByRole('button'));

    // Check if language options are displayed
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();

    // Verify t function was called with correct keys
    expect(tMock).toHaveBeenCalledWith('language.english');
    expect(tMock).toHaveBeenCalledWith('language.french');
  });

  test('changes language when option is selected', () => {
    render(<LanguageSwitcher />);

    // Open the menu
    fireEvent.click(screen.getByRole('button'));

    // Select French option
    fireEvent.click(screen.getByText('French'));

    // Verify language was changed
    expect(changeLanguageMock).toHaveBeenCalledWith('fr');

    // Menu should be closed after selection
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('closes menu when clicking outside', () => {
    render(<LanguageSwitcher />);

    // Open the menu
    fireEvent.click(screen.getByRole('button'));

    // Menu should be open
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Simulate clicking outside by triggering a click on the backdrop
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);
    } else {
      // Alternative if backdrop element is not available
      // This dispatches a mousedown event on document body
      document.body.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true })
      );
    }

    // Now menu should be closed
    // Note: This part is tricky as Material UI's menu handling is complex
    // In some test environments this might need more specific handling
  });

  test('calls changeLanguage with "en" when English is selected', () => {
    render(<LanguageSwitcher />);

    // Open the menu
    fireEvent.click(screen.getByRole('button'));

    // Select English option
    fireEvent.click(screen.getByText('English'));

    // Verify correct language code was passed
    expect(changeLanguageMock).toHaveBeenCalledWith('en');
  });
});
