export interface Message {
  id: string;
  content: string;
  timestamp: number;
  from: string;
  to: string;
  subject?: string;
  contentType?: string;
  processed?: boolean;
  metadata?: {
    messageId?: string;
    hasText?: boolean;
    hasHtml?: boolean;
    hasRaw?: boolean;
    hasAttachments?: boolean;
    rawSize?: number;
    headers?: Record<string, string>;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DeleteResponse {
  success: boolean;
  message: string;
} 