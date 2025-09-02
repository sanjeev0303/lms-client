/**
 * Route Preloader Hook
 * Optimizes navigation by preloading routes and data
 */

"use client";

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useCallback } from 'react';
import { QUERY_KEYS } from '@/lib/constants/api';
import { courseService } from '@/lib/api/services';

export const useRoutePreloader = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const preloadRoute = useCallback(async (href: string) => {
    // Preload the route component
    router.prefetch(href);

    // Extract and preload route-specific data
    if (href.includes('/course-detail/')) {
      const courseId = href.split('/course-detail/')[1];
      if (courseId) {
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
          queryFn: async () => {
            const token = await getToken();
            const response = await courseService.getCourseById(courseId, token || undefined);
            return response.data;
          },
          staleTime: 60 * 1000,
        });
      }
    }

    if (href.includes('/dashboard/course/')) {
      const pathParts = href.split('/dashboard/course/');
      if (pathParts[1] && !pathParts[1].includes('create')) {
        // Handle different course route patterns
        const routePart = pathParts[1];
        let courseId: string | undefined;

        // Extract courseId from different patterns:
        // - /dashboard/course/{id}
        // - /dashboard/course/edit-course/{id}
        // - /dashboard/course/{id}/lecture
        if (routePart.startsWith('edit-course/')) {
          courseId = routePart.split('edit-course/')[1]?.split('/')[0];
        } else {
          courseId = routePart.split('/')[0];
        }

        if (courseId && courseId !== 'edit-course' && courseId !== 'create') {
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
            queryFn: async () => {
              const token = await getToken();
              const response = await courseService.getCourseById(courseId, token || undefined);
              return response.data;
            },
            staleTime: 30 * 1000,
          });
        }
      }
    }
  }, [router, queryClient, getToken]);

  const handleLinkHover = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;

    if (link?.href && link.href.startsWith(window.location.origin)) {
      const href = new URL(link.href).pathname;
      preloadRoute(href);
    }
  }, [preloadRoute]);

  const handleLinkClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;

    if (link?.href && link.href.startsWith(window.location.origin)) {
      // Add loading class for visual feedback
      link.classList.add('loading');

      // Remove loading class after navigation
      setTimeout(() => {
        link.classList.remove('loading');
      }, 1000);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseover', handleLinkHover, { passive: true });
    document.addEventListener('click', handleLinkClick, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleLinkHover);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [handleLinkHover, handleLinkClick]);

  return { preloadRoute };
};

// CSS for loading states (add to globals.css)
export const routePreloaderStyles = `
  a.loading {
    opacity: 0.7;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  a.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: translateY(-50%) rotate(360deg);
    }
  }
`;

export default useRoutePreloader;
