/**
 * Enhanced API Client with GET Request Deduplication and Single Token Refresh
 * Reduces API costs by preventing duplicate in-flight requests and cross-tab coordination
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/lib/constants/api';
import type { ApiResponse } from '@/types/api';
import { logger } from '@/lib/utils/logger';

// Request deduplication cache
const inFlightRequests = new Map<string, Promise<any>>();

// Cross-tab token refresh coordination
class TokenRefreshCoordinator {
    private static instance: TokenRefreshCoordinator;
    private refreshPromise: Promise<string | null> | null = null;
    private channel: BroadcastChannel | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.channel = new BroadcastChannel('token-refresh');
            this.channel.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    static getInstance(): TokenRefreshCoordinator {
        if (!TokenRefreshCoordinator.instance) {
            TokenRefreshCoordinator.instance = new TokenRefreshCoordinator();
        }
        return TokenRefreshCoordinator.instance;
    }

    private handleMessage(event: MessageEvent) {
        if (event.data.type === 'token-refreshed') {
            // Another tab refreshed the token, clear our refresh promise
            this.refreshPromise = null;
        }
    }

    async coordinateRefresh(refreshFunction: () => Promise<string | null>): Promise<string | null> {
        // If already refreshing in this tab, wait for it
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        // Check if another tab is refreshing (simple localStorage check)
        const refreshLock = localStorage.getItem('token-refresh-lock');
        if (refreshLock && Date.now() - parseInt(refreshLock) < 30000) {
            // Another tab is refreshing, wait briefly and return
            await new Promise(resolve => setTimeout(resolve, 1000));
            return null;
        }

        // Acquire refresh lock
        localStorage.setItem('token-refresh-lock', Date.now().toString());

        try {
            this.refreshPromise = refreshFunction();
            const newToken = await this.refreshPromise;

            // Notify other tabs
            if (this.channel && newToken) {
                this.channel.postMessage({ type: 'token-refreshed', token: newToken });
            }

            return newToken;
        } finally {
            // Release lock
            localStorage.removeItem('token-refresh-lock');
            this.refreshPromise = null;
        }
    }
}

// Enhanced API Client with deduplication
export class OptimizedApiClient {
    private baseURL: string;
    private defaultHeaders: Record<string, string>;
    private tokenRefreshCoordinator: TokenRefreshCoordinator;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        this.tokenRefreshCoordinator = TokenRefreshCoordinator.getInstance();
    }

    /**
     * Create cache key for request deduplication
     */
    private createCacheKey(method: string, url: string, headers?: Record<string, string>): string {
        const authHeader = headers?.['Authorization'] || '';
        return `${method}:${url}:${authHeader}`;
    }

    /**
     * Deduplicated GET request
     */
    async get<T>(
        endpoint: string,
        config: { headers?: Record<string, string>; timeout?: number } = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = this.createCacheKey('GET', url, config.headers);

        // Check if request is already in-flight
        const existingRequest = inFlightRequests.get(cacheKey);
        if (existingRequest) {
            logger.debug('API_CLIENT', 'Deduplicating GET request', { endpoint, cacheKey });
            return existingRequest;
        }

        // Create new request
        const requestPromise = this.executeRequest<T>('GET', endpoint, undefined, config);

        // Cache the promise
        inFlightRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Remove from cache when complete
            setTimeout(() => inFlightRequests.delete(cacheKey), 100);
        }
    }

    /**
     * Standard POST request (no deduplication for mutations)
     */
    async post<T>(
        endpoint: string,
        data?: any,
        config: { headers?: Record<string, string>; timeout?: number } = {}
    ): Promise<ApiResponse<T>> {
        return this.executeRequest<T>('POST', endpoint, data, config);
    }

    /**
     * Standard PUT request
     */
    async put<T>(
        endpoint: string,
        data?: any,
        config: { headers?: Record<string, string>; timeout?: number } = {}
    ): Promise<ApiResponse<T>> {
        return this.executeRequest<T>('PUT', endpoint, data, config);
    }

    /**
     * Standard DELETE request
     */
    async delete<T>(
        endpoint: string,
        config: { headers?: Record<string, string>; timeout?: number } = {}
    ): Promise<ApiResponse<T>> {
        return this.executeRequest<T>('DELETE', endpoint, undefined, config);
    }

    /**
     * Execute HTTP request with proper error handling
     */
    private async executeRequest<T>(
        method: string,
        endpoint: string,
        data?: any,
        config: { headers?: Record<string, string>; timeout?: number } = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const { timeout = REQUEST_TIMEOUT.DEFAULT, headers = {} } = config;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const requestHeaders = {
                ...this.defaultHeaders,
                ...headers,
            };

            // Remove Content-Type for FormData
            if (data instanceof FormData && requestHeaders['Content-Type']) {
                delete requestHeaders['Content-Type'];
            }

            const response = await fetch(url, {
                method,
                headers: requestHeaders,
                body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle response
            let responseData: any;
            const contentType = response.headers.get('content-type');

            if (contentType?.includes('application/json')) {
                responseData = await response.json();
            } else if (contentType?.includes('text/')) {
                responseData = await response.text();
            } else {
                responseData = await response.blob();
            }

            if (!response.ok) {
                throw new Error(responseData?.message || `HTTP error! status: ${response.status}`);
            }

            // Ensure consistent response format
            if (typeof responseData === 'object' && responseData !== null && 'success' in responseData) {
                return responseData as ApiResponse<T>;
            }

            return {
                success: true,
                data: responseData as T,
            };

        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            throw error;
        }
    }

    /**
     * Set authorization token
     */
    setAuthToken(token: string): void {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Clear authorization token
     */
    clearAuthToken(): void {
        delete this.defaultHeaders['Authorization'];
    }

    /**
     * Clear all in-flight request cache (for testing)
     */
    static clearCache(): void {
        inFlightRequests.clear();
    }
}

// Export singleton instance
export const optimizedApiClient = new OptimizedApiClient();

// Export utility function for creating authenticated clients
export function createOptimizedAuthenticatedClient(token: string): OptimizedApiClient {
    const client = new OptimizedApiClient();
    client.setAuthToken(token);
    return client;
}
