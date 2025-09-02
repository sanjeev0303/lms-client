/**
 * Data Preloader Utility
 * Preloads critical data in the background to improve perceived performance
 */

import { QUERY_KEYS, CACHE_CONFIG, API_ENDPOINTS, REQUEST_TIMEOUT } from '@/lib/constants/api';
import { fastApiClient } from '@/lib/api/fast-client';

// Simple in-memory cache for preloaded data
const preloadCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Cache data with timestamp
 */
function setCacheData(key: string, data: any): void {
    preloadCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get cached data if it's still fresh
 */
function getCacheData(key: string, maxAge: number = CACHE_CONFIG.STALE_TIME.SHORT): any | null {
    const cached = preloadCache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
        return cached.data;
    }
    return null;
}

/**
 * Preload published courses in the background
 */
export async function preloadPublishedCourses(): Promise<void> {
    try {
        // Check if data is already cached and fresh
        const existingData = getCacheData('published-courses');
        if (existingData) {
            return;
        }

        // Preload with fast client
        const data = await fastApiClient.get(API_ENDPOINTS.COURSE_PUBLISHED, { timeout: REQUEST_TIMEOUT.FAST });

        // Set the data in cache
        setCacheData('published-courses', data);

        console.log('✅ Preloaded published courses');
    } catch (error) {
        // Lower log level to debug to reduce console noise
        console.debug('⚠️ Failed to preload published courses:', error);
    }
}

/**
 * Preload user profile data
 */
export async function preloadUserProfile(token?: string): Promise<void> {
    try {
        // Skip preloading if no token is available
        if (!token) {
            console.log('⚠️ Skipping user profile preload - no auth token');
            return;
        }

        const existingData = getCacheData('user-profile');
        if (existingData) {
            return;
        }

        const data = await fastApiClient.get(API_ENDPOINTS.ME, {
            timeout: REQUEST_TIMEOUT.FAST,
            token // Pass the auth token
        });
        setCacheData('user-profile', data);

        console.log('✅ Preloaded user profile');
    } catch (error) {
        console.debug('⚠️ Failed to preload user profile:', error);
        // Don't throw error to prevent blocking the app
    }
}

/**
 * Get preloaded data
 */
export function getPreloadedData(key: string): any | null {
    return getCacheData(key);
}

/**
 * Preload critical data based on route
 */
export async function preloadCriticalData(route: string, authToken?: string): Promise<void> {
    const promises: Promise<void>[] = [];

    // Preload user profile only if authenticated
    if (authToken) {
        promises.push(preloadUserProfile(authToken));
    }

    // Route-specific preloading
    if (route === '/' || route === '/courses') {
        promises.push(preloadPublishedCourses());
    }

    // Execute all preloads in parallel
    await Promise.allSettled(promises);
}

/**
 * Warm up the cache with essential data
 */
export function warmUpCache(): void {
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
        // Only preload public data, skip user-specific data without auth
        preloadCriticalData(window.location.pathname); // Will skip user profile if no token
    }, 100);
}
