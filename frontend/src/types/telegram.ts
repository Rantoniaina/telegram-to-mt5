/**
 * Telegram API type definitions.
 */

export interface TelegramCredentials {
  api_id: number;
  api_hash: string;
  phone?: string;
}

export interface Dialog {
  id: number;
  name: string;
  type: string;
  entity_id: number;
  unread_count: number;
}

export interface Sender {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  type: string;
}

export interface Message {
  id: number;
  text: string;
  date: string;
  sender_id?: number;
  sender?: Sender;
  has_media: boolean;
  views?: number;
  forwards?: number;
  reply_to_msg_id?: number;
}

export interface SearchRequest {
  query: string;
  dialog_ids?: number[];
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 