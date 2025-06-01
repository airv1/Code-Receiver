import type { Message } from '../types';

// 获取 Worker URL
const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

console.log('当前环境变量:', import.meta.env);
console.log('Worker URL:', workerUrl);

// 调试信息
console.log('环境变量:', {
  VITE_WORKER_URL: import.meta.env.VITE_WORKER_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const getAuthHeaders = (): HeadersInit => {
  const username = localStorage.getItem('auth_username') || '';
  const password = localStorage.getItem('auth_password') || '';
  const base64Credentials = btoa(`${username}:${password}`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${base64Credentials}`,
  };
};

export const fetchMessages = async (): Promise<ApiResponse<Message[]>> => {
  try {
    if (!workerUrl) {
      return { success: false, error: '未配置 Worker URL' };
    }
    
    const response = await fetch(`${workerUrl}/messages`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 响应错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return { success: false, error: `请求失败: ${response.status} ${response.statusText}` };
    }
    
    const data = await response.json();
    if (!data || !Array.isArray(data.messages)) {
      console.error('API 响应格式错误:', data);
      return { success: false, error: '响应格式错误' };
    }
    
    return { success: true, data: data.messages };
  } catch (error) {
    console.error('获取消息错误:', error);
    return { success: false, error: '获取消息失败' };
  }
};

export const deleteMessage = async (id: string): Promise<ApiResponse<void>> => {
  try {
    if (!workerUrl) {
      return { success: false, error: '未配置 Worker URL' };
    }
    
    const response = await fetch(`${workerUrl}/messages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('删除消息错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return { success: false, error: `删除失败: ${response.status} ${response.statusText}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('删除消息错误:', error);
    return { success: false, error: '删除消息失败' };
  }
};

export const clearAllMessages = async (): Promise<ApiResponse<void>> => {
  try {
    if (!workerUrl) {
      return { success: false, error: '未配置 Worker URL' };
    }
    
    const response = await fetch(`${workerUrl}/messages`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('清空消息错误:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return { success: false, error: `清空失败: ${response.status} ${response.statusText}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('清空消息错误:', error);
    return { success: false, error: '清空消息失败' };
  }
};