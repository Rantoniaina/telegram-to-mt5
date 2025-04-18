import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncCard } from '../SyncCard';
import syncService from '../../../services/syncService';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => key,
    };
  },
}));

// Mock syncService
jest.mock('../../../services/syncService', () => ({
  updateSyncState: jest.fn(),
  deleteSync: jest.fn(),
}));

// Mock ConfirmDialog
jest.mock('../../common/ConfirmDialog', () => ({
  __esModule: true,
  default: jest.fn(({ open, onConfirm, onCancel }) =>
    open ? (
      <div data-testid='confirm-dialog'>
        <button data-testid='confirm-button' onClick={onConfirm}>
          Confirm
        </button>
        <button data-testid='cancel-button' onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null
  ),
}));

describe('SyncCard', () => {
  const mockSync = {
    id: 1,
    user_id: 1,
    discussion_name: 'Test Sync',
    state: 'ACTIVE',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockSyncUpdated = jest.fn();
  const mockSyncDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sync name correctly', () => {
    render(<SyncCard sync={mockSync} />);
    expect(screen.getByText('Test Sync')).toBeInTheDocument();
  });

  it('displays the correct status indicator color for ACTIVE state', () => {
    render(<SyncCard sync={mockSync} />);
    const statusDot = screen.getByLabelText('Status indicator');
    expect(statusDot).toHaveStyle('background-color: #4CAF50');
  });

  it('displays the correct status indicator color for PAUSED state', () => {
    const pausedSync = { ...mockSync, state: 'PAUSED' };
    render(<SyncCard sync={pausedSync} />);
    const statusDot = screen.getByLabelText('Status indicator');
    expect(statusDot).toHaveStyle('background-color: #FFA500');
  });

  it('displays the correct status indicator color for STOPPED state', () => {
    const stoppedSync = { ...mockSync, state: 'STOPPED' };
    render(<SyncCard sync={stoppedSync} />);
    const statusDot = screen.getByLabelText('Status indicator');
    expect(statusDot).toHaveStyle('background-color: #757575');
  });

  it('displays the correct status indicator color for ERROR state', () => {
    const errorSync = { ...mockSync, state: 'ERROR' };
    render(<SyncCard sync={errorSync} />);
    const statusDot = screen.getByLabelText('Status indicator');
    expect(statusDot).toHaveStyle('background-color: #F44336');
  });

  it('shows pause and stop buttons for ACTIVE state', () => {
    render(<SyncCard sync={mockSync} />);
    expect(screen.getByLabelText('sync.tooltip.pause')).toBeInTheDocument();
    expect(screen.getByLabelText('sync.tooltip.stop')).toBeInTheDocument();
  });

  it('shows resume and stop buttons for PAUSED state', () => {
    const pausedSync = { ...mockSync, state: 'PAUSED' };
    render(<SyncCard sync={pausedSync} />);
    expect(screen.getByLabelText('sync.tooltip.resume')).toBeInTheDocument();
    expect(screen.getByLabelText('sync.tooltip.stop')).toBeInTheDocument();
  });

  it('shows play button for STOPPED state', () => {
    const stoppedSync = { ...mockSync, state: 'STOPPED' };
    render(<SyncCard sync={stoppedSync} />);
    expect(screen.getByLabelText('sync.tooltip.play')).toBeInTheDocument();
  });

  it('shows play button for ERROR state', () => {
    const errorSync = { ...mockSync, state: 'ERROR' };
    render(<SyncCard sync={errorSync} />);
    expect(screen.getByLabelText('sync.tooltip.play')).toBeInTheDocument();
  });

  it('shows delete button for all states', () => {
    render(<SyncCard sync={mockSync} />);
    expect(screen.getByLabelText('sync.tooltip.delete')).toBeInTheDocument();
  });

  it('opens confirmation dialog when pause button is clicked', () => {
    render(<SyncCard sync={mockSync} />);
    fireEvent.click(screen.getByLabelText('sync.tooltip.pause'));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('opens confirmation dialog when stop button is clicked', () => {
    render(<SyncCard sync={mockSync} />);
    fireEvent.click(screen.getByLabelText('sync.tooltip.stop'));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('opens confirmation dialog when delete button is clicked', () => {
    render(<SyncCard sync={mockSync} />);
    fireEvent.click(screen.getByLabelText('sync.tooltip.delete'));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('calls updateSyncState with PAUSED when pause is confirmed', async () => {
    (syncService.updateSyncState as jest.Mock).mockResolvedValue({
      ...mockSync,
      state: 'PAUSED',
    });

    render(
      <SyncCard
        sync={mockSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.pause'));
    fireEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => {
      expect(syncService.updateSyncState).toHaveBeenCalledWith(1, 'PAUSED');
      expect(mockSyncUpdated).toHaveBeenCalledWith({
        ...mockSync,
        state: 'PAUSED',
      });
    });
  });

  it('calls updateSyncState with STOPPED when stop is confirmed', async () => {
    (syncService.updateSyncState as jest.Mock).mockResolvedValue({
      ...mockSync,
      state: 'STOPPED',
    });

    render(
      <SyncCard
        sync={mockSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.stop'));
    fireEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => {
      expect(syncService.updateSyncState).toHaveBeenCalledWith(1, 'STOPPED');
      expect(mockSyncUpdated).toHaveBeenCalledWith({
        ...mockSync,
        state: 'STOPPED',
      });
    });
  });

  it('calls deleteSync when delete is confirmed', async () => {
    (syncService.deleteSync as jest.Mock).mockResolvedValue({
      detail: 'Sync deleted successfully',
    });

    render(
      <SyncCard
        sync={mockSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.delete'));
    fireEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => {
      expect(syncService.deleteSync).toHaveBeenCalledWith(1);
      expect(mockSyncDeleted).toHaveBeenCalledWith(1);
    });
  });

  it('calls updateSyncState with ACTIVE when resume button is clicked for PAUSED state', async () => {
    const pausedSync = { ...mockSync, state: 'PAUSED' };
    (syncService.updateSyncState as jest.Mock).mockResolvedValue({
      ...pausedSync,
      state: 'ACTIVE',
    });

    render(
      <SyncCard
        sync={pausedSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.resume'));

    await waitFor(() => {
      expect(syncService.updateSyncState).toHaveBeenCalledWith(1, 'ACTIVE');
      expect(mockSyncUpdated).toHaveBeenCalledWith({
        ...pausedSync,
        state: 'ACTIVE',
      });
    });
  });

  it('calls updateSyncState with ACTIVE when play button is clicked for STOPPED state', async () => {
    const stoppedSync = { ...mockSync, state: 'STOPPED' };
    (syncService.updateSyncState as jest.Mock).mockResolvedValue({
      ...stoppedSync,
      state: 'ACTIVE',
    });

    render(
      <SyncCard
        sync={stoppedSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.play'));

    await waitFor(() => {
      expect(syncService.updateSyncState).toHaveBeenCalledWith(1, 'ACTIVE');
      expect(mockSyncUpdated).toHaveBeenCalledWith({
        ...stoppedSync,
        state: 'ACTIVE',
      });
    });
  });

  it('handles errors when updateSyncState fails', async () => {
    console.error = jest.fn();
    (syncService.updateSyncState as jest.Mock).mockRejectedValue(
      new Error('Failed to update state')
    );

    render(
      <SyncCard
        sync={mockSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.pause'));
    fireEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(mockSyncUpdated).not.toHaveBeenCalled();
    });
  });

  it('handles errors when deleteSync fails', async () => {
    console.error = jest.fn();
    (syncService.deleteSync as jest.Mock).mockRejectedValue(
      new Error('Failed to delete sync')
    );

    render(
      <SyncCard
        sync={mockSync}
        onSyncUpdated={mockSyncUpdated}
        onSyncDeleted={mockSyncDeleted}
      />
    );

    fireEvent.click(screen.getByLabelText('sync.tooltip.delete'));
    fireEvent.click(screen.getByTestId('confirm-button'));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(mockSyncDeleted).not.toHaveBeenCalled();
    });
  });
});
