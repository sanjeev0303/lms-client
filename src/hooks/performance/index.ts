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
        staleTime: CACHE_CONFIG.STALE_TIME.VERY_LONG, // 1 hour - much longer stale time
        gcTime: CACHE_CONFIG.GC_TIME.LONG, // 30 minutes
        retry: 1, // Only 1 retry for fast operations
        retryDelay: 1000, // Slower retry to avoid server pressure
        refetchOnMount: false, // Always use cached data on mount
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // Don't refetch on reconnect
        // REMOVED: Background refetch to reduce API costs
        refetchInterval: false, // REMOVED: No automatic polling
        refetchIntervalInBackground: false, // REMOVED: No background polling
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
        staleTime: CACHE_CONFIG.STALE_TIME.VERY_LONG, // 1 hour - extended stale time
        gcTime: CACHE_CONFIG.GC_TIME.LONG,
        retry: 1,
        retryDelay: 1000, // Slower retry
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // REMOVED: Background refetch to reduce API costs
        refetchInterval: false, // REMOVED: No automatic polling
        refetchIntervalInBackground: false, // REMOVED: No background polling
        ...options,
    });
}

/**
 * Hook for fast server health check
 * OPTIMIZED: Removed aggressive polling to reduce API costs
 */
export function useServerHealth() {
    return useQuery({
        queryKey: ['serverHealth'],
        queryFn: () => fastApiClient.healthCheck(),
        staleTime: 10 * 60 * 1000, // 10 minutes - much longer stale time
        retry: 1,
        retryDelay: 1000,
        refetchInterval: false, // REMOVED: No automatic polling
        refetchIntervalInBackground: false, // REMOVED: No background polling
        refetchOnWindowFocus: false, // REMOVED: No refetch on focus
        // Health checks should only happen:
        // 1. On manual user action (explicit refetch)
        // 2. On component mount
        // 3. On API error recovery
    });
}
