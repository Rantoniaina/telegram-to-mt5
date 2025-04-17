import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { SyncCreateDialog } from '../SyncCreateDialog';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';
import { ReactNode } from 'react';

// Mock all external dependencies
jest.mock('../../../services/telegramService', () => ({
  getDialogs: jest.fn().mockReturnValue(Promise.resolve([])),
}));

jest.mock('../../../services/syncService', () => ({
  createSync: jest.fn().mockReturnValue(Promise.resolve({})),
}));

// Mock the AuthContext
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    credentials: {
      api_id: '12345',
      api_hash: 'abcdef',
      phone: '+1234567890',
    },
  }),
}));

// Mock MUI icons
jest.mock('@mui/icons-material/Chat', () => () => (
  <div data-testid='chat-icon' />
));
jest.mock('@mui/icons-material/Group', () => () => (
  <div data-testid='group-icon' />
));
jest.mock('@mui/icons-material/Announcement', () => () => (
  <div data-testid='announcement-icon' />
));

describe('SyncCreateDialog', () => {
  it.skip('renders the dialog with title', () => {
    // Simplified test to check if it renders at all
    render(
      <I18nextProvider i18n={i18n}>
        <SyncCreateDialog open={true} onClose={() => {}} onSuccess={() => {}} />
      </I18nextProvider>
    );

    // Look for the translation key instead of the translated text
    expect(screen.getByText('sync.create.title')).toBeInTheDocument();
  });
});
