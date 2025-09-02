/**
 * API Module Index
 * Centralized exports for all API-related functionality
 */

// Core API client
export {
    ApiClient,
    ApiClientError,
    apiClient,
    createAuthenticatedApiClient,
    dockerUtils,
} from './client';

// Development utilities (only available in development)
export const devUtils = process.env.NODE_ENV === 'development' ? {
    testDockerConnectivity: async () => {
        const mod = await import('./docker-test');
        return mod.testDockerConnectivity();
    },
    switchApiMode: async (mode: 'direct' | 'proxy' | 'auto') => {
        const mod = await import('./docker-test');
        return mod.switchApiMode(mode);
    },
    createTestClient: async (baseURL: string) => {
        const mod = await import('./docker-test');
        return mod.createTestClient(baseURL);
    },
    quickHealthCheck: async () => {
        const mod = await import('./docker-test');
        return mod.quickHealthCheck();
    },
} : {};

// Re-export types
export type { ApiResponse } from '@/types/api';
