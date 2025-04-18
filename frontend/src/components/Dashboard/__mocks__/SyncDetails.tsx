import React from 'react';

export const SyncDetails = jest.fn(
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
);
