// 从环境变量获取 API URL，如果没有设置则使用默认值
const envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
console.log('Environment API URL:', envApiUrl);

export const API_URL = envApiUrl || 'http://localhost:8787';
console.log('Final API URL:', API_URL);

// 确保 API URL 不以斜杠结尾
export const API_URL_CLEAN = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
console.log('Cleaned API URL:', API_URL_CLEAN);

// 认证相关的配置
export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USERNAME_KEY = 'auth_username';
export const AUTH_PASSWORD_KEY = 'auth_password';

// API 端点
export const API_ENDPOINTS = {
  LOGIN: '/login',
  MESSAGES: '/messages',
  MESSAGE: (id: string) => `/messages/${id}`,
} as const;

// 打印所有 API 端点
console.log('API Endpoints:', {
  LOGIN: `${API_URL}${API_ENDPOINTS.LOGIN}`,
  MESSAGES: `${API_URL}${API_ENDPOINTS.MESSAGES}`,
  MESSAGE: (id: string) => `${API_URL}${API_ENDPOINTS.MESSAGE(id)}`,
}); 