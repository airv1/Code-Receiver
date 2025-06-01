import axios from 'axios';
import { API_URL_CLEAN } from '../config';
import { getStoredToken, getStoredUsername, getStoredPassword } from './auth';

console.log('API URL:', API_URL_CLEAN);

export const api = axios.create({
  baseURL: API_URL_CLEAN,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const username = getStoredUsername();
    const password = getStoredPassword();
    
    if (username && password) {
      const base64Credentials = btoa(`${username}:${password}`);
      config.headers.Authorization = `Basic ${base64Credentials}`;
    }
    
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
      localStorage.removeItem('auth_password');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
); 