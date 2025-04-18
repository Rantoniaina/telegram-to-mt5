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
        'sync.status.setActive': 'Set Active',
        'sync.status.setPaused': 'Set Paused',
        'sync.status.setStopped': 'Set Stopped',
        'sync.status.setError': 'Set Error',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the SyncCreateDialog component
jest.mock('../SyncCreateDialog', () => ({
  SyncCreateDialog: jest.fn(({ open, onClose, onSuccess }) =>
    open ? (
      <div data-testid='mock-dialog'>
        Mock Dialog
        <button onClick={onClose}>Close</button>
        <button
          onClick={() => {
            onSuccess && onSuccess();
            onClose();
          }}
        >
          Create Sync
        </button>
      </div>
    ) : null
  ),
}));

// Mock SyncCard component
jest.mock('../SyncCard', () => ({
  SyncCard: jest.fn(({ sync, onClick, onSyncUpdated, onSyncDeleted }) => (
    <div data-testid={`sync-card-${sync.id}`} onClick={() => onClick(sync)}>
      {sync.discussion_name}
      <button
        data-testid={`sync-menu-${sync.id}`}
        onClick={(e) => {
          e.stopPropagation();
          // This mock doesn't actually trigger the menu open event
          // but we can test other functionality
        }}
      >
        Menu
      </button>
    </div>
  )),
}));

// Mock SyncDetails component
jest.mock('../SyncDetails', () => ({
  SyncDetails: jest.fn(
    ({ sync, open, onClose, onSyncUpdated, onSyncDeleted }) => {
      if (!open) return null;
      return (
        <div data-testid='mock-sync-details'>
          {sync && (
            <>
              <div data-testid='sync-name'>{sync.discussion_name}</div>
              <div data-testid='sync-state'>{sync.state}</div>
              <button
                data-testid='update-sync-button'
                onClick={() =>
                  onSyncUpdated &&
                  onSyncUpdated({
                    ...sync,
                    state: 'UPDATED',
                  })
                }
              >
                Update Sync
              </button>
              <button
                data-testid='delete-sync-button'
                onClick={() => onSyncDeleted && onSyncDeleted(sync.id)}
              >
                Delete Sync
              </button>
              <button data-testid='close-details-button' onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      );
    }
  ),
}));

describe('MetaTraderSection', () => {
  const renderWithI18n = (component: React.ReactNode) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock success API response - empty array by default
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

  it('fetches and displays syncs from API', async () => {
    const mockSyncs = [
      {
        id: 1,
        discussion_name: 'Test Sync 1',
        state: 'ACTIVE',
        created_at: '2022-01-01T00:00:00Z',
      },
      {
        id: 2,
        discussion_name: 'Test Sync 2',
        state: 'PAUSED',
        created_at: '2022-01-02T00:00:00Z',
      },
    ];

    (apiService.get as jest.Mock).mockResolvedValue(mockSyncs);

    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('sync-card-2')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Sync 1')).toBeInTheDocument();
    expect(screen.getByText('Test Sync 2')).toBeInTheDocument();
  });

  it('opens sync details when a sync card is clicked', async () => {
    const mockSyncs = [
      {
        id: 1,
        discussion_name: 'Test Sync 1',
        state: 'ACTIVE',
        created_at: '2022-01-01T00:00:00Z',
      },
    ];

    (apiService.get as jest.Mock).mockResolvedValue(mockSyncs);

    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-card-1')).toBeInTheDocument();
    });

    // Click on sync card
    fireEvent.click(screen.getByTestId('sync-card-1'));

    // Details should open
    await waitFor(() => {
      expect(screen.getByTestId('mock-sync-details')).toBeInTheDocument();
      expect(screen.getByTestId('sync-name')).toHaveTextContent('Test Sync 1');
      expect(screen.getByTestId('sync-state')).toHaveTextContent('ACTIVE');
    });
  });

  it('closes sync details when close button is clicked', async () => {
    const mockSyncs = [
      {
        id: 1,
        discussion_name: 'Test Sync 1',
        state: 'ACTIVE',
        created_at: '2022-01-01T00:00:00Z',
      },
    ];

    (apiService.get as jest.Mock).mockResolvedValue(mockSyncs);

    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-card-1')).toBeInTheDocument();
    });

    // Click on sync card to open details
    fireEvent.click(screen.getByTestId('sync-card-1'));

    // Details should open
    await waitFor(() => {
      expect(screen.getByTestId('mock-sync-details')).toBeInTheDocument();
    });

    // Click close button
    fireEvent.click(screen.getByTestId('close-details-button'));

    // Details should close
    await waitFor(() => {
      expect(screen.queryByTestId('mock-sync-details')).not.toBeInTheDocument();
    });
  });

  it('updates sync when update button is clicked in details', async () => {
    const mockSyncs = [
      {
        id: 1,
        discussion_name: 'Test Sync 1',
        state: 'ACTIVE',
        created_at: '2022-01-01T00:00:00Z',
      },
    ];

    (apiService.get as jest.Mock).mockResolvedValue(mockSyncs);

    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-card-1')).toBeInTheDocument();
    });

    // Click on sync card to open details
    fireEvent.click(screen.getByTestId('sync-card-1'));

    // Details should open
    await waitFor(() => {
      expect(screen.getByTestId('mock-sync-details')).toBeInTheDocument();
    });

    // Click update button
    fireEvent.click(screen.getByTestId('update-sync-button'));

    // Sync should be updated
    (apiService.get as jest.Mock).mockResolvedValue([
      {
        id: 1,
        discussion_name: 'Test Sync 1',
        state: 'UPDATED',
        created_at: '2022-01-01T00:00:00Z',
      },
    ]);

    // Details should still be open, but with updated state
    await waitFor(() => {
      expect(screen.getByTestId('sync-name')).toHaveTextContent('Test Sync 1');
      expect(screen.getByTestId('sync-state')).toHaveTextContent('UPDATED');
    });
  });

  it('deletes sync when delete button is clicked in details', async () => {
    const mockSyncs = [
      {
        id: 1,
        discussion_name: 'Test Sync 1',
        state: 'ACTIVE',
        created_at: '2022-01-01T00:00:00Z',
      },
    ];

    (apiService.get as jest.Mock).mockResolvedValue(mockSyncs);

    renderWithI18n(<MetaTraderSection />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-card-1')).toBeInTheDocument();
    });

    // Click on sync card to open details
    fireEvent.click(screen.getByTestId('sync-card-1'));

    // Details should open
    await waitFor(() => {
      expect(screen.getByTestId('mock-sync-details')).toBeInTheDocument();
    });

    // Mock empty array after deletion
    (apiService.get as jest.Mock).mockResolvedValue([]);

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-sync-button'));

    // Details should close and sync should be removed
    await waitFor(() => {
      expect(screen.queryByTestId('mock-sync-details')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sync-card-1')).not.toBeInTheDocument();
    });
  });

  it('creates new sync when create button is clicked in dialog', async () => {
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

    // Mock syncs after creation
    const mockSyncs = [
      {
        id: 1,
        discussion_name: 'New Test Sync',
        state: 'ACTIVE',
        created_at: '2022-01-01T00:00:00Z',
      },
    ];
    (apiService.get as jest.Mock).mockResolvedValue(mockSyncs);

    // Click create button
    fireEvent.click(screen.getByText('Create Sync'));

    // Dialog should close and sync should appear
    await waitFor(() => {
      expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('sync-card-1')).toBeInTheDocument();
      expect(screen.getByText('New Test Sync')).toBeInTheDocument();
    });
  });
});
