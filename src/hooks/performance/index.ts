/**
 * Performance-optimized React Query hooks
 * Prioritizes cached data and reduces server load
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { CACHE_CONFIG, QUERY_KEYS } from '@/lib/constants/api';
import { fastApiClient } from '@/lib/api/fast-client';

/**
 * Hook for published courses with aggressive caching
 */
export function usePublishedCoursesFast() {
    return useQuery({
        queryKey: QUERY_KEYS.PUBLISHED_COURSES,
        queryFn: async () => {
            // Try fast client first (using the regular get method with short timeout)
            try {
                const result = await fastApiClient.get('/course/published', {
                    timeout: 2000, // 2 second timeout
                });
                return result;
            } catch (error) {
                // Fallback - let React Query use cached data
                throw new Error('Fast fetch failed, using cached data');
            }
        },
        staleTime: CACHE_CONFIG.STALE_TIME.LONG, // 15 minutes
        gcTime: CACHE_CONFIG.GC_TIME.LONG, // 30 minutes
        retry: 1, // Only 1 retry for fast operations
        retryDelay: 500, // Quick retry
        refetchOnMount: false, // Always use cached data on mount
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // Don't refetch on reconnect
        // Enable background refetch but don't show loading state
        refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
        refetchIntervalInBackground: true,
    });
}

/**
 * Hook that prefers cached data and shows it immediately
 */
export function useCachedQuery<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: Partial<UseQueryOptions<T>>
) {
    return useQuery({
        queryKey,
        queryFn,
        staleTime: CACHE_CONFIG.STALE_TIME.LONG,
        gcTime: CACHE_CONFIG.GC_TIME.LONG,
        retry: 1,
        retryDelay: 500,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Show cached data immediately, refetch in background
        refetchInterval: 10 * 60 * 1000, // 10 minutes
        refetchIntervalInBackground: true,
        ...options,
    });
}

/**
 * Hook for fast server health check
 */
export function useServerHealth() {
    return useQuery({
        queryKey: ['serverHealth'],
        queryFn: () => fastApiClient.healthCheck(),
        staleTime: 30000, // 30 seconds
        retry: 1,
        retryDelay: 200,
        refetchInterval: 30000, // Check every 30 seconds
        refetchIntervalInBackground: true,
    });
}
