/**
 * Consolidated Course View Hook
 * Combines course detail, enrollment, lectures, and progress in a single optimized hook
 * Reduces API calls and improves data consistency
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

import { courseService, lectureService, progressService } from '@/lib/api/services';
import { CACHE_CONFIG } from '@/lib/constants/api';

export interface CourseViewData {
  course: any;
  lectures: any[];
  enrollment: { isEnrolled: boolean };
  progress: any | null;
  isLoading: boolean;
  error: any;
}

/**
 * Hook to get all course-related data in a single optimized call
 */
export const useCourseView = (courseId: string): CourseViewData => {
  const { isSignedIn, getToken } = useAuth();

  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['courseView', courseId, isSignedIn],
    queryFn: async () => {
      const token = await getToken();

      // Parallel API calls for better performance
      const [courseResponse, lecturesResponse, enrollmentResponse, progressResponse] = await Promise.allSettled([
        courseService.getCourseById(courseId, token || undefined),
        lectureService.getCourseLectures(courseId, token || undefined),
        isSignedIn ? courseService.checkEnrollmentStatus(courseId, token || undefined) : Promise.resolve({ data: { isEnrolled: false } }),
        isSignedIn ? progressService.getCourseProgress(courseId, token || undefined) : Promise.resolve({ data: null })
      ]);

      return {
        course: courseResponse.status === 'fulfilled' ? courseResponse.value.data : null,
        lectures: lecturesResponse.status === 'fulfilled' ? lecturesResponse.value.data : [],
        enrollment: enrollmentResponse.status === 'fulfilled' ? enrollmentResponse.value.data : { isEnrolled: false },
        progress: progressResponse.status === 'fulfilled' ? progressResponse.value.data : null
      };
    },
    enabled: !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    retry: 1, // Reduced retries for faster failure handling
    refetchOnWindowFocus: false,
  });

  return {
    course: data?.course || null,
    lectures: data?.lectures || [],
    enrollment: data?.enrollment || { isEnrolled: false },
    progress: data?.progress || null,
    isLoading,
    error
  };
};
