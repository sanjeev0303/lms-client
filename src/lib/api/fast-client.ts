/**
 * Fast API Client
 * Optimized for critical operations with minimal overhead
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/lib/constants/api';

interface FastRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  token?: string;
}

class FastApiClient {
  private baseURL: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private createUrl(endpoint: string): string {
    return `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  private createHeaders(config: FastRequestConfig = {}): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...config.headers,
    });

    if (config.token) {
      headers.set('Authorization', `Bearer ${config.token}`);
    }

    return headers;
  }

  // Cancel previous request if still pending
  private cancelPreviousRequest(key: string): void {
    const existingController = this.abortControllers.get(key);
    if (existingController) {
      existingController.abort();
    }
  }

  async request<T = unknown>(
    endpoint: string,
    config: FastRequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      timeout = REQUEST_TIMEOUT.FAST, // Use centralized FAST timeout (3s)
    } = config;

    // Create unique key for request deduplication
    const requestKey = `${method}:${endpoint}`;
    this.cancelPreviousRequest(requestKey);

    const controller = new AbortController();
    this.abortControllers.set(requestKey, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(this.createUrl(endpoint), {
        method,
        headers: this.createHeaders(config),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        // Performance optimizations
        cache: method === 'GET' ? 'default' : 'no-store',
        keepalive: true,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  // Optimized GET request
  async get<T = unknown>(endpoint: string, config: Omit<FastRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  // Optimized POST request
  async post<T = unknown>(endpoint: string, body?: unknown, config: Omit<FastRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  // Optimized PUT request
  async put<T = unknown>(endpoint: string, body?: unknown, config: Omit<FastRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  // Optimized DELETE request
  async delete<T = unknown>(endpoint: string, config: Omit<FastRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Optimized PATCH request
  async patch<T = unknown>(endpoint: string, body?: unknown, config: Omit<FastRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // Health check with minimal overhead
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: REQUEST_TIMEOUT.FAST });
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const fastApiClient = new FastApiClient();
export default FastApiClient;
