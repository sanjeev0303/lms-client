/**
 * Server Health Check Utility
 * Helps verify server status before making critical requests
 */

import { API_BASE_URL } from '@/lib/constants/api';

interface HealthStatus {
    isHealthy: boolean;
    responseTime: number;
    error?: string;
}

let lastHealthCheck: HealthStatus | null = null;
let lastCheckTime = 0;
const HEALTH_CHECK_CACHE_TIME = 15000; // Reduced to 15 seconds for faster updates

/**
 * Check if the server is healthy
 */
export async function checkServerHealth(force = false): Promise<HealthStatus> {
    const now = Date.now();

    // Return cached result if available and recent (unless forced)
    if (!force && lastHealthCheck && (now - lastCheckTime) < HEALTH_CHECK_CACHE_TIME) {
        return lastHealthCheck;
    }

    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 seconds for faster feedback

        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
            lastHealthCheck = {
                isHealthy: true,
                responseTime,
            };
        } else {
            lastHealthCheck = {
                isHealthy: false,
                responseTime,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        lastHealthCheck = {
            isHealthy: false,
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }

    lastCheckTime = now;
    return lastHealthCheck;
}

/**
 * Get cached health status (non-blocking)
 */
export function getCachedHealthStatus(): HealthStatus | null {
    return lastHealthCheck;
}

/**
 * Clear health check cache
 */
export function clearHealthCache(): void {
    lastHealthCheck = null;
    lastCheckTime = 0;
}
