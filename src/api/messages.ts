import type { Message, MessagesResponse } from '../types';
import { api } from './api';
import { API_ENDPOINTS } from '../config';

export async function getMessages(page = 1, limit = 10): Promise<MessagesResponse> {
  try {
    const response = await api.get<MessagesResponse>(API_ENDPOINTS.MESSAGES, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('获取消息失败:', error);
    throw error;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    await api.delete(`${API_ENDPOINTS.MESSAGES}/${id}`);
  } catch (error) {
    console.error('删除消息失败:', error);
    throw error;
  }
}

export async function clearAllMessages(): Promise<void> {
  try {
    await api.delete(API_ENDPOINTS.MESSAGES);
  } catch (error) {
    console.error('清空消息失败:', error);
    throw error;
  }
} 