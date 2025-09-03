/**
 * Lightweight API Client
 * Minimal overhead for critical operations - reduces bundle size
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/lib/constants/api';

interface LightRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
}

class LightApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request<T = unknown>(
    endpoint: string,
    config: LightRequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      token,
    } = config;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return response.text() as unknown as T;
  }

  async get<T = unknown>(endpoint: string, config: Omit<LightRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown, config: Omit<LightRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown, config: Omit<LightRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async delete<T = unknown>(endpoint: string, config: Omit<LightRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Export lightweight singleton
export const lightApiClient = new LightApiClient();
export default LightApiClient;
