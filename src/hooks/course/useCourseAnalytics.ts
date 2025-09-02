/**
 * Course Analytics React Query hooks
 * Handles course analytics and statistics
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

import { courseService } from '@/lib/api/services';
import { QUERY_KEYS, CACHE_CONFIG } from '@/lib/constants/api';

/**
 * Hook to get analytics for a specific course (instructor only)
 */
export const useCourseAnalytics = (courseId: string) => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.COURSE_ANALYTICS(courseId),
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.getCourseAnalytics(courseId, token || undefined);
      return response.data;
    },
    enabled: isSignedIn && !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM, // Analytics update less frequently
    gcTime: CACHE_CONFIG.GC_TIME.LONG,
    retry: CACHE_CONFIG.RETRY.DEFAULT,
    refetchOnWindowFocus: false, // Don't refetch analytics on focus
    refetchOnMount: false, // Use cache when mounting
  });
};

/**
 * Hook to get instructor dashboard analytics summary
 */
export const useInstructorAnalytics = () => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ['instructorAnalytics'],
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.getCreatorCourses(token || undefined);

      // Calculate summary analytics from courses
      const courses = response.data || [];
      const totalRevenue = courses.reduce((sum, course) => sum + (course.revenue || 0), 0);
      const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0);
      const totalCourses = courses.length;
      const publishedCourses = courses.filter(course => course.isPublished).length;

      return {
        totalRevenue,
        totalEnrollments,
        totalCourses,
        publishedCourses,
        courses: courses.slice(0, 5) // Recent 5 courses for dashboard
      };
    },
    enabled: isSignedIn,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.LONG,
    retry: CACHE_CONFIG.RETRY.DEFAULT,
  });
};
