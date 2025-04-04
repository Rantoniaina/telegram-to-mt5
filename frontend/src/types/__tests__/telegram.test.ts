import {
  TelegramCredentials,
  Dialog,
  Sender,
  Message,
  SearchRequest,
  ApiResponse
} from '../telegram';

// Type tests don't have runtime behavior but verify type compatibility
describe('Telegram Types', () => {
  test('TelegramCredentials accepts valid data', () => {
    const validCredentials: TelegramCredentials = {
      api_id: 12345,
      api_hash: 'abcdef1234567890',
      phone: '+1234567890'
    };

    // Minimal valid credentials without optional phone
    const minimalCredentials: TelegramCredentials = {
      api_id: 12345,
      api_hash: 'abcdef1234567890'
    };

    // Type assertion - no runtime checks but ensures type compatibility
    expect(validCredentials.api_id).toBe(12345);
    expect(minimalCredentials.api_hash).toBe('abcdef1234567890');
  });

  test('Dialog type accepts valid data', () => {
    const dialog: Dialog = {
      id: 123,
      name: 'Test Group',
      type: 'group',
      entity_id: 456,
      unread_count: 5
    };

    expect(dialog.id).toBe(123);
    expect(dialog.name).toBe('Test Group');
  });

  test('Sender type accepts valid data', () => {
    const fullSender: Sender = {
      id: 123,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      phone: '+1234567890',
      type: 'user'
    };

    const minimalSender: Sender = {
      id: 456,
      type: 'channel'
    };

    expect(fullSender.username).toBe('johndoe');
    expect(minimalSender.type).toBe('channel');
  });

  test('Message type accepts valid data', () => {
    const sender: Sender = {
      id: 123,
      first_name: 'John',
      type: 'user'
    };

    const message: Message = {
      id: 789,
      text: 'Hello world',
      date: '2023-05-01T12:00:00Z',
      sender_id: 123,
      sender,
      has_media: false,
      views: 10,
      forwards: 2,
      reply_to_msg_id: 456
    };

    const simpleMessage: Message = {
      id: 101,
      text: 'Simple message',
      date: '2023-05-02T14:30:00Z',
      has_media: false
    };

    expect(message.text).toBe('Hello world');
    expect(simpleMessage.has_media).toBe(false);
  });

  test('SearchRequest type accepts valid data', () => {
    const fullRequest: SearchRequest = {
      query: 'test',
      dialog_ids: [123, 456],
      limit: 50
    };

    const minimalRequest: SearchRequest = {
      query: 'test'
    };

    expect(fullRequest.query).toBe('test');
    expect(minimalRequest.query).toBe('test');
  });

  test('ApiResponse type accepts valid data', () => {
    const successResponse: ApiResponse<string> = {
      success: true,
      data: 'Success data'
    };

    const errorResponse: ApiResponse<number[]> = {
      success: false,
      error: 'Error message'
    };

    expect(successResponse.success).toBe(true);
    expect(errorResponse.success).toBe(false);
  });
}); 