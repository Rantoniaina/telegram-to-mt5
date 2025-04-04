// Mock modules before importing the service
jest.mock('../apiService');

// Import after mocking
import apiService from '../apiService';
import telegramService from '../telegramService';
import { 
  TelegramCredentials, 
  Dialog, 
  Message, 
  SearchRequest 
} from '../../types/telegram';

// Mock console methods to avoid noise in test output
console.log = jest.fn();
console.error = jest.fn();

describe('telegramService', () => {
  const mockCredentials: TelegramCredentials = {
    api_id: 12345,
    api_hash: 'test_hash',
    phone: '+1234567890'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Set up default mock implementation for apiService.post
    (apiService.post as jest.Mock).mockImplementation((endpoint, data) => {
      return Promise.resolve({ success: true });
    });
  });

  describe('connect', () => {
    test('should convert api_id to number and call the correct endpoint', async () => {
      const stringIdCredentials = {
        ...mockCredentials,
        api_id: '12345' as unknown as number  // Simulate string input
      };
      
      const expectedPayload = {
        ...stringIdCredentials,
        api_id: 12345  // Should be converted to number
      };

      const mockResponse = { success: true };
      (apiService.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await telegramService.connect(stringIdCredentials);
      
      expect(apiService.post).toHaveBeenCalledWith('/telegram/connect', expectedPayload);
      expect(result).toEqual(mockResponse);
    });

    test('should return needs_verification flag when API requires verification', async () => {
      const mockResponse = { 
        success: false, 
        needs_verification: true 
      };
      
      (apiService.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await telegramService.connect(mockCredentials);
      
      expect(result).toEqual(mockResponse);
      expect(result.needs_verification).toBe(true);
    });
  });

  describe('submitVerificationCode', () => {
    test('should send verification code with credentials', async () => {
      const code = '12345';
      const mockResponse = { success: true };
      
      (apiService.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await telegramService.submitVerificationCode(mockCredentials, code);
      
      expect(apiService.post).toHaveBeenCalledWith('/telegram/verify_code', {
        credentials: {
          ...mockCredentials,
          api_id: 12345
        },
        code,
        password: undefined
      });
      expect(result).toEqual(mockResponse);
    });

    test('should include password when provided', async () => {
      const code = '12345';
      const password = 'securepassword';
      const mockResponse = { success: true };
      
      (apiService.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await telegramService.submitVerificationCode(mockCredentials, code, password);
      
      expect(apiService.post).toHaveBeenCalledWith('/telegram/verify_code', {
        credentials: {
          ...mockCredentials,
          api_id: 12345
        },
        code,
        password
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('disconnect', () => {
    test('should call the disconnect endpoint with credentials', async () => {
      const mockResponse = { success: true };
      
      (apiService.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await telegramService.disconnect(mockCredentials);
      
      expect(apiService.post).toHaveBeenCalledWith('/telegram/disconnect', mockCredentials);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDialogs', () => {
    test('should retrieve dialogs list', async () => {
      const mockDialogs: Dialog[] = [
        { id: 1, name: 'Dialog 1', type: 'private', entity_id: 100, unread_count: 5 },
        { id: 2, name: 'Dialog 2', type: 'group', entity_id: 200, unread_count: 0 }
      ];
      
      (apiService.post as jest.Mock).mockResolvedValue(mockDialogs);
      
      const result = await telegramService.getDialogs(mockCredentials);
      
      expect(apiService.post).toHaveBeenCalledWith('/telegram/dialogs', mockCredentials);
      expect(result).toEqual(mockDialogs);
      expect(result.length).toBe(2);
    });
  });

  describe('getMessages', () => {
    test('should retrieve messages with default parameters', async () => {
      const dialogId = 123;
      const mockMessages: Message[] = [
        { 
          id: 1, 
          text: 'Hello', 
          date: '2023-01-01T12:00:00', 
          sender_id: 456, 
          has_media: false 
        }
      ];
      
      (apiService.post as jest.Mock).mockResolvedValue(mockMessages);
      
      const result = await telegramService.getMessages(dialogId, mockCredentials);
      
      expect(apiService.post).toHaveBeenCalledWith(
        '/telegram/messages/123?limit=100&offset_id=0', 
        mockCredentials
      );
      expect(result).toEqual(mockMessages);
    });

    test('should use custom limit and offset when provided', async () => {
      const dialogId = 123;
      const limit = 50;
      const offsetId = 789;
      const mockMessages: Message[] = [];
      
      (apiService.post as jest.Mock).mockResolvedValue(mockMessages);
      
      const result = await telegramService.getMessages(dialogId, mockCredentials, limit, offsetId);
      
      expect(apiService.post).toHaveBeenCalledWith(
        '/telegram/messages/123?limit=50&offset_id=789', 
        mockCredentials
      );
      expect(result).toEqual(mockMessages);
    });
  });

  describe('searchMessages', () => {
    test('should search messages with the provided query', async () => {
      const searchRequest: SearchRequest = {
        query: 'test message',
        dialog_ids: [123, 456]
      };
      
      const mockMessages: Message[] = [
        { 
          id: 1, 
          text: 'Test message content', 
          date: '2023-01-01T12:00:00', 
          sender_id: 789, 
          has_media: false 
        }
      ];
      
      (apiService.post as jest.Mock).mockResolvedValue(mockMessages);
      
      const result = await telegramService.searchMessages(searchRequest, mockCredentials);
      
      expect(apiService.post).toHaveBeenCalledWith('/telegram/search', {
        ...searchRequest,
        credentials: mockCredentials
      });
      expect(result).toEqual(mockMessages);
    });
  });
}); 