/**
 * Performance Optimization Component
 * Handles lazy loading, prefetching, and performance monitoring
 */

"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, API_ENDPOINTS, REQUEST_TIMEOUT } from '@/lib/constants/api';
import { courseService } from '@/lib/api/services';
import { apiClient } from '@/lib/api/client';
import { warmUpCache, preloadCriticalData, getPreloadedData } from '@/lib/utils/preloader';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefetchedRoutes = useRef(new Set<string>());

  // Prefetch critical data on app load
  useEffect(() => {
    const prefetchCriticalData = async () => {
      try {
        // Use both preloader and React Query for better caching
        warmUpCache(); // Warm up simple cache

        // Try hydrate from preloader cache first to avoid extra network
        const preloaded = getPreloadedData('published-courses');
        if (preloaded && !queryClient.getQueryData(QUERY_KEYS.PUBLISHED_COURSES)) {
          const list = preloaded?.data ?? preloaded;
          queryClient.setQueryData(QUERY_KEYS.PUBLISHED_COURSES, list);
        }

        // Prefetch published courses (most common landing page data)
        if (!queryClient.getQueryData(QUERY_KEYS.PUBLISHED_COURSES)) {
          await queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.PUBLISHED_COURSES,
            queryFn: async () => {
              const response = await apiClient.get<typeof preloaded>(API_ENDPOINTS.COURSE_PUBLISHED, {
                timeout: REQUEST_TIMEOUT.FAST,
                retries: 0,
              });
              return (response as any)?.data ?? response;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes (increased for slow server)
            retry: 0, // Don’t retry background prefetches to reduce log noise
          });
        }
      } catch (error) {
        // Silent fail for prefetch
        console.debug('Prefetch failed:', error);
      }
    };

    // Delay prefetch to not block initial render
    setTimeout(prefetchCriticalData, 200); // Increased delay
  }, [queryClient]);

  // Link hover prefetching
  useEffect(() => {
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);
        const pathname = url.pathname;

        // Only prefetch internal links
        if (url.origin === window.location.origin && !prefetchedRoutes.current.has(pathname)) {
          prefetchedRoutes.current.add(pathname);

          // Prefetch the route
          router.prefetch(pathname);

          // Prefetch route-specific data
          prefetchRouteData(pathname);
        }
      }
    };

    const prefetchRouteData = (pathname: string) => {
      // Anchor matches to the start of the pathname to avoid matching dashboard/admin URLs
      const courseDetailMatch = pathname.match(/^\/course-detail\/([^\/]+)/);
      if (courseDetailMatch) {
        const courseId = courseDetailMatch[1];
        if (courseId && courseId !== 'create') {
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
            queryFn: async () => {
              const response = await courseService.getCourseById(courseId);
              return response.data;
            },
            staleTime: 60 * 1000, // 1 minute
            retry: 0,
          });
        }
      }

      // Course learning page (only when pathname starts with /course/...)
      const courseLearningMatch = pathname.match(/^\/course\/([^\/]+)/);
      if (courseLearningMatch) {
        const courseId = courseLearningMatch[1];
        // Skip reserved slugs like "create" to avoid hitting POST-only endpoints with GET
        if (courseId && courseId !== 'create') {
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
            queryFn: async () => {
              const response = await courseService.getCourseById(courseId);
              return response.data;
            },
            staleTime: 60 * 1000,
            retry: 0,
          });
        }
      }
    };

    // Add event listeners for link hovering
    document.addEventListener('mouseover', handleLinkHover, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleLinkHover);
    };
  }, [router, queryClient]);

  // Performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          // Log slow navigation
          if (entry.entryType === 'navigation' && entry.duration > 3000) {
            console.warn('Slow navigation detected:', entry.duration + 'ms');
          }

          // Log large resources
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.transferSize && resourceEntry.transferSize > 500000) {
              console.warn('Large resource detected:', entry.name, resourceEntry.transferSize + 'bytes');
            }
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error) {
        // Observer not supported
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return <>{children}</>;
};

export default PerformanceOptimizer;
