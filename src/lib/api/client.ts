/**
 * Unified API Client
 * Centralized HTTP client with proper error handling, retry logic, and type safety
 */

import { API_BASE_URL, REQUEST_TIMEOUT, CACHE_CONFIG } from '@/lib/constants/api';
import type { ApiResponse } from '@/types/api';
import { logger } from '@/lib/utils/logger';

// Helper to normalize HeadersInit to a plain object
function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};
    if (headers instanceof Headers) {
        const obj: Record<string, string> = {};
        headers.forEach((value, key) => { obj[key] = value; });
        return obj;
    }
    if (Array.isArray(headers)) {
        return Object.fromEntries(headers as Array<[string, string]>);
    }
    return headers as Record<string, string>;
}

// Custom error class for API errors
export class ApiClientError extends Error {
    public statusCode: number;
    public response?: Response;
    public data?: any;

    constructor(message: string, statusCode: number, response?: Response, data?: any) {
        super(message);
        this.name = 'ApiClientError';
        this.statusCode = statusCode;
        this.response = response;
        this.data = data;
    }
}

// Request configuration interface
interface RequestConfig extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

// Enhanced fetch with timeout support
async function fetchWithTimeout(
    url: string,
    config: RequestConfig = {}
): Promise<Response> {
    const { timeout = REQUEST_TIMEOUT.DEFAULT, ...fetchConfig } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchConfig,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiClientError('Request timeout', 408);
        }
        throw error;
    }
}

// Retry mechanism with exponential backoff (optimized for server issues)
async function withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 2, // default when not overridden
    baseDelay: number = 1000 // Increased base delay
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on client errors (4xx) except 429 (rate limit) and 408 (timeout)
            if (error instanceof ApiClientError &&
                error.statusCode >= 400 &&
                error.statusCode < 500 &&
                error.statusCode !== 429 &&
                error.statusCode !== 408) {
                throw error;
            }

            // Retry on server errors (5xx) and network errors
            if (attempt < retries) {
                const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000); // Max 5s delay
                // Use structured logging instead of console.debug
                logger.debug('API_CLIENT', `Retry attempt after error`, {
                    attempt: attempt + 1,
                    retries,
                    delay,
                    error: error instanceof ApiClientError ? error.message : 'Network error'
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError!;
}

/**
 * Unified API Client Class
 */
export class ApiClient {
    private baseURL: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Log API configuration in development
        if (process.env.NODE_ENV === 'development') {
            logger.debug('API_CLIENT', `API Client initialized`, { baseURL: this.baseURL });
        }
    }

    /**
     * Switch between direct API access and nginx proxy
     */
    useDirectAccess(): void {
        this.baseURL = `${process.env.NEXT_PUBLIC_API_URL}`;
        logger.debug('API_CLIENT', `Switched to direct API access`, { baseURL: this.baseURL });
    }

    useProxyAccess(): void {
        this.baseURL = `${process.env.NEXT_PUBLIC_API_URL}`;
        logger.debug('API_CLIENT', `Switched to nginx proxy`, { baseURL: this.baseURL });
    }

    /**
     * Get current base URL
     */
    getBaseURL(): string {
        return this.baseURL;
    }

    /**
     * Set authorization token for all requests
     */
    setAuthToken(token: string): void {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Remove authorization token
     */
    clearAuthToken(): void {
        delete this.defaultHeaders['Authorization'];
    }

    /**
     * Make HTTP request with proper error handling
     */
    private async request<T>(
        endpoint: string,
        config: RequestConfig = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        // Reduce default retries on the browser to avoid double-retry with React Query
        const isBrowser = typeof window !== 'undefined';
        const { retries = isBrowser ? 1 : 2, retryDelay = 1000, ...requestConfig } = config;

        // Build headers and strip JSON Content-Type for FormData bodies
        const requestHeaders = normalizeHeaders({
            ...this.defaultHeaders,
            ...config.headers,
        } as HeadersInit);
        const isFormData = typeof FormData !== 'undefined' && requestConfig.body instanceof FormData;
        if (isFormData && requestHeaders['Content-Type']) {
            // Let the browser set the correct multipart boundary
            delete requestHeaders['Content-Type'];
        }

        const operation = async (): Promise<ApiResponse<T>> => {
            try {
                const response = await fetchWithTimeout(url, {
                    ...requestConfig,
                    headers: requestHeaders,
                });

                // Handle different response types
                let data: any;
                const contentType = response.headers.get('content-type');

                if (contentType?.includes('application/json')) {
                    data = await response.json();
                } else if (contentType?.includes('text/')) {
                    data = await response.text();
                } else {
                    data = await response.blob();
                }

                if (!response.ok) {
                    throw new ApiClientError(
                        data?.message || `HTTP error! status: ${response.status}`,
                        response.status,
                        response,
                        data
                    );
                }

                // Ensure consistent response format
                if (typeof data === 'object' && data !== null && 'success' in data) {
                    return data as ApiResponse<T>;
                }

                // Wrap plain data in ApiResponse format
                return {
                    success: true,
                    data: data as T,
                };

            } catch (error) {
                if (error instanceof ApiClientError) {
                    throw error;
                }

                // Handle network errors - try fallback URL in development
                if (process.env.NODE_ENV === 'development' && !url.includes('5000')) {
                    console.warn(`🔄 Network error with proxy, trying direct access: ${error}`);
                    const fallbackUrl = url.replace(`${process.env.NEXT_PUBLIC_API_URL}`, `${process.env.NEXT_PUBLIC_API_URL}`);

                    try {
                        const fallbackResponse = await fetchWithTimeout(fallbackUrl, {
                            ...requestConfig,
                            headers: requestHeaders,
                        });

                        let fallbackData: any;
                        const fallbackContentType = fallbackResponse.headers.get('content-type');

                        if (fallbackContentType?.includes('application/json')) {
                            fallbackData = await fallbackResponse.json();
                        } else if (fallbackContentType?.includes('text/')) {
                            fallbackData = await fallbackResponse.text();
                        } else {
                            fallbackData = await fallbackResponse.blob();
                        }

                        if (!fallbackResponse.ok) {
                            throw new ApiClientError(
                                fallbackData?.message || `HTTP error! status: ${fallbackResponse.status}`,
                                fallbackResponse.status,
                                fallbackResponse,
                                fallbackData
                            );
                        }

                        console.log('✅ Fallback to direct access succeeded');

                        if (typeof fallbackData === 'object' && fallbackData !== null && 'success' in fallbackData) {
                            return fallbackData as ApiResponse<T>;
                        }

                        return {
                            success: true,
                            data: fallbackData as T,
                        };
                    } catch (fallbackError) {
                        // If fallback also fails, throw original error
                        console.error('❌ Both proxy and direct access failed');
                    }
                }

                // Handle network errors
                throw new ApiClientError(
                    error instanceof Error ? error.message : 'Network error',
                    0
                );
            }
        };

        return withRetry(operation, retries, retryDelay);
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData
                ? { ...config?.headers } // Let browser set Content-Type for FormData
                : { ...config?.headers },
        });
    }

    /**
     * PUT request
     */
    async put<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData
                ? { ...config?.headers }
                : { ...config?.headers },
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'DELETE',
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PATCH',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData
                ? { ...config?.headers }
                : { ...config?.headers },
        });
    }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export utility function for creating authenticated API client
export function createAuthenticatedApiClient(token: string): ApiClient {
    const client = new ApiClient();
    client.setAuthToken(token);
    return client;
}

// Docker development utilities
export const dockerUtils = {
    /**
     * Test connectivity to both direct API and nginx proxy
     */
    async testConnectivity(): Promise<{
        direct: boolean;
        proxy: boolean;
        directResponse?: any;
        proxyResponse?: any;
    }> {
        const results = {
            direct: false,
            proxy: false,
            directResponse: undefined as any,
            proxyResponse: undefined as any,
        };

        // Test direct API access
        try {
            const directClient = new ApiClient(`${process.env.NEXT_PUBLIC_API_URL}`);
            const directResult = await directClient.get('/health');
            results.direct = true;
            results.directResponse = directResult;
            console.log('✅ Direct API access working:', directResult);
        } catch (error) {
            console.warn('❌ Direct API access failed:', error);
        }

        // Test nginx proxy
        try {
            const proxyClient = new ApiClient(`${process.env.NEXT_PUBLIC_API_URL}`);
            const proxyResult = await proxyClient.get('/health');
            results.proxy = true;
            results.proxyResponse = proxyResult;
            console.log('✅ Nginx proxy working:', proxyResult);
        } catch (error) {
            console.warn('❌ Nginx proxy failed:', error);
        }

        return results;
    },

    /**
     * Get recommended API configuration for current environment
     */
    getRecommendedConfig(): {
        baseURL: string;
        reason: string;
    } {
        if (typeof window === 'undefined') {
            // Server-side: use direct access for better performance
            return {
                baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
                reason: 'Server-side rendering - using direct API access'
            };
        } else {
            // Client-side: use proxy for CORS and load balancing
            return {
                baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
                reason: 'Client-side - using nginx proxy for load balancing'
            };
        }
    },

    /**
     * Switch default client to use the recommended configuration
     */
    applyRecommendedConfig(): void {
        const config = this.getRecommendedConfig();
        if (config.baseURL === `${process.env.NEXT_PUBLIC_API_URL}`) {
            apiClient.useDirectAccess();
        } else {
            apiClient.useProxyAccess();
        }
        console.log(`🎯 Applied recommended config: ${config.reason}`);
    }
};
