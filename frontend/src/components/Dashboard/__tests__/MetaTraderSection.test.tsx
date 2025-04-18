import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetaTraderSection } from '../MetaTraderSection';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';
import apiService from '../../../services/apiService';

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

// Mock AddIcon
jest.mock('@mui/icons-material/Add', () => ({
  __esModule: true,
  default: () => <div data-testid='AddIcon'>Mock AddIcon</div>,
}));

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
        'metatrader.title': 'Metatrader 5 Sync',
        'metatrader.description':
          'Configure your Metatrader 5 integration settings here.',
        'common.create': 'Create',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the SyncCreateDialog component
jest.mock('../SyncCreateDialog', () => ({
  SyncCreateDialog: jest.fn(({ open, onClose }) =>
    open ? (
      <div data-testid='mock-dialog'>
        Mock Dialog <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// Mock SyncCard component
jest.mock('../SyncCard', () => ({
  SyncCard: jest.fn(({ sync }) => (
    <div data-testid={`sync-card-${sync.id}`}>{sync.discussion_name}</div>
  )),
}));

describe('MetaTraderSection', () => {
  const renderWithI18n = (component: React.ReactNode) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock success API response - empty array
    (apiService.get as jest.Mock).mockResolvedValue([]);
  });

  it('renders title and description', async () => {
    renderWithI18n(<MetaTraderSection onCreateClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Metatrader 5 Sync')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Configure your Metatrader 5 integration settings here.'
        )
      ).toBeInTheDocument();
    });
  });

  it('renders create card', async () => {
    renderWithI18n(<MetaTraderSection onCreateClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });
  });

  it('calls onCreateClick when create card is clicked', async () => {
    const handleCreateClick = jest.fn();
    renderWithI18n(<MetaTraderSection onCreateClick={handleCreateClick} />);

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    const createCard = screen.getByText('Create').closest('div');
    if (createCard) {
      fireEvent.click(createCard);
    }

    expect(handleCreateClick).toHaveBeenCalledTimes(1);
  });

  it('renders add icon', async () => {
    renderWithI18n(<MetaTraderSection onCreateClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
    });
  });

  it('opens SyncCreateDialog when create card is clicked and no onCreateClick prop is provided', async () => {
    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    const createCard = screen.getByText('Create').closest('div');
    if (createCard) {
      fireEvent.click(createCard);
    }

    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
  });

  it('closes SyncCreateDialog when dialog is closed', async () => {
    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    // Open dialog
    const createCard = screen.getByText('Create').closest('div');
    if (createCard) {
      fireEvent.click(createCard);
    }

    // Dialog should be open
    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();

    // Close dialog
    fireEvent.click(screen.getByText('Close'));

    // Dialog should be closed
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });
});
