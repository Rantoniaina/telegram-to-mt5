import React, { useState } from 'react';

export const SyncCreateDialog = jest.fn(({ open, onClose, onSuccess }) => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!channelName) {
      setError('Channel name is required');
      return;
    }

    onSuccess && onSuccess();
    onClose();
  };

  return (
    <div data-testid='mock-sync-dialog'>
      <h2>Create New Sync</h2>

      <div>
        <label>Channel Name</label>
        <input
          type='text'
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder='Enter Telegram channel name'
          data-testid='channel-name-input'
        />
        {error && <div data-testid='error-message'>{error}</div>}
      </div>

      <div>
        <label>Description</label>
        <input
          type='text'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Enter a description'
          data-testid='description-input'
        />
      </div>

      <div>
        <button onClick={onClose} data-testid='cancel-button'>
          Cancel
        </button>
        <button onClick={handleSubmit} data-testid='create-button'>
          Create
        </button>
      </div>
    </div>
  );
});
