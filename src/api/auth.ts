import { API_URL_CLEAN, API_URL } from '../config';
import { api } from './api';
import { API_ENDPOINTS, AUTH_TOKEN_KEY, AUTH_USERNAME_KEY, AUTH_PASSWORD_KEY } from '../config';
import type { LoginResponse } from '../types';
import axios from 'axios';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
}

export interface CredentialsResponse {
  success: boolean;
  message?: string;
  credentials: LoginCredentials;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
    });
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying request to ${url}, ${retries} attempts remaining`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

export const getCredentials = async (): Promise<LoginCredentials> => {
  try {
    console.log('Fetching credentials from:', `${API_URL_CLEAN}/credentials`);
    const response = await fetchWithRetry(`${API_URL_CLEAN}/credentials`, {
      headers: {
        'Authorization': 'Basic ' + btoa('admin:admin')
      }
    });
    
    console.log('Credentials response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Credentials error response:', errorText);
      throw new Error(`Failed to get credentials: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data: CredentialsResponse = await response.json();
    console.log('Credentials response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get credentials');
    }
    
    return data.credentials;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    throw error;
  }
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('Attempting login with username:', username);
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, {
      username,
      password,
    });

    console.log('Login response:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '登录失败');
    }

    // 存储认证信息
    localStorage.setItem(AUTH_USERNAME_KEY, username);
    localStorage.setItem(AUTH_PASSWORD_KEY, password);
    const token = btoa(`${username}:${password}`);
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || '登录失败';
      throw new Error(message);
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_PASSWORD_KEY);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(AUTH_USERNAME_KEY);
}

export function getStoredPassword(): string | null {
  return localStorage.getItem(AUTH_PASSWORD_KEY);
} 