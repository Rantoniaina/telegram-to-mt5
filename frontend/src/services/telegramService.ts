/**
 * Telegram Service for interacting with the Telegram API endpoints.
 */

import apiService from './apiService';
import { 
  TelegramCredentials, 
  Dialog, 
  Message, 
  SearchRequest, 
  ApiResponse 
} from '../types/telegram';

// Endpoints
const ENDPOINTS = {
  CONNECT: '/telegram/connect',
  DISCONNECT: '/telegram/disconnect',
  DIALOGS: '/telegram/dialogs',
  MESSAGES: '/telegram/messages',
  SEARCH: '/telegram/search',
  VERIFY_CODE: '/telegram/verify_code',
};

interface VerificationResponse {
  success: boolean;
  needs_password?: boolean;
}

interface ConnectResponse {
  success: boolean;
  needs_verification?: boolean;
}

/**
 * Service to interact with Telegram API endpoints.
 */
const telegramService = {
  /**
   * Connect to Telegram using API credentials.
   * 
   * @param credentials - Telegram API credentials
   * @returns Promise resolving to success status
   */
  async connect(credentials: TelegramCredentials): Promise<ConnectResponse> {
    // Ensure API ID is a number
    const payload = {
      ...credentials,
      api_id: Number(credentials.api_id)
    };
    console.log('Connecting with credentials:', payload);
    return apiService.post<ConnectResponse>(ENDPOINTS.CONNECT, payload);
  },

  /**
   * Submit verification code for Telegram authentication.
   * 
   * @param credentials - Telegram API credentials
   * @param code - Verification code received on phone
   * @param password - Two-step verification password (if needed)
   * @returns Promise resolving to verification status
   */
  async submitVerificationCode(
    credentials: TelegramCredentials,
    code: string,
    password?: string
  ): Promise<VerificationResponse> {
    const payload = {
      credentials: {
        ...credentials,
        api_id: Number(credentials.api_id)
      },
      code,
      password
    };
    
    console.log('Submitting verification code:', payload);
    return apiService.post<VerificationResponse>(ENDPOINTS.VERIFY_CODE, payload);
  },

  /**
   * Disconnect from Telegram.
   * 
   * @param credentials - Telegram API credentials
   * @returns Promise resolving to success status
   */
  async disconnect(credentials: TelegramCredentials): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(ENDPOINTS.DISCONNECT, credentials);
  },

  /**
   * Get all dialogs (chats, channels, groups).
   * 
   * @param credentials - Telegram API credentials
   * @returns Promise resolving to a list of dialogs
   */
  async getDialogs(credentials: TelegramCredentials): Promise<Dialog[]> {
    return apiService.post<Dialog[]>(ENDPOINTS.DIALOGS, credentials);
  },

  /**
   * Get messages from a specific dialog.
   * 
   * @param dialogId - ID of the dialog to get messages from
   * @param credentials - Telegram API credentials
   * @param limit - Maximum number of messages to retrieve (default: 100)
   * @param offsetId - Message ID to start from (default: 0)
   * @returns Promise resolving to a list of messages
   */
  async getMessages(
    dialogId: number, 
    credentials: TelegramCredentials, 
    limit: number = 100, 
    offsetId: number = 0
  ): Promise<Message[]> {
    return apiService.post<Message[]>(
      `${ENDPOINTS.MESSAGES}/${dialogId}?limit=${limit}&offset_id=${offsetId}`, 
      credentials
    );
  },

  /**
   * Search for messages containing specific text.
   * 
   * @param searchRequest - Search parameters
   * @param credentials - Telegram API credentials
   * @returns Promise resolving to a list of found messages
   */
  async searchMessages(
    searchRequest: SearchRequest, 
    credentials: TelegramCredentials
  ): Promise<any[]> {
    return apiService.post<any[]>(
      ENDPOINTS.SEARCH,
      {
        ...searchRequest,
        credentials
      }
    );
  }
};

export default telegramService; 