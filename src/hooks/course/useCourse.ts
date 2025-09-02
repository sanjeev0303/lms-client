/**
 * Course-related React Query hooks with optimized caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { courseService } from '@/lib/api/services';
import { QUERY_KEYS, CACHE_CONFIG } from '@/lib/constants/api';
import type { CreateCourseRequest, UpdateCourseFormData } from '@/types/api';

/**
 * Hook to get courses created by the current user - optimized
 */
export const useCreatorCourses = () => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.CREATOR_COURSES,
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.getCreatorCourses(token || undefined);
      return response.data;
    },
    enabled: isSignedIn,
    staleTime: CACHE_CONFIG.STALE_TIME.SHORT,  // 30 seconds for user's own data
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,     // 5 minutes in memory
    retry: CACHE_CONFIG.RETRY.DEFAULT,        // 1 retry
    refetchOnWindowFocus: false,              // Don't refetch on focus
  });
};

/**
 * Hook to get all published courses (public) - optimized for performance
 */
export const usePublishedCourses = () => {
  return useQuery({
    queryKey: QUERY_KEYS.PUBLISHED_COURSES,
    queryFn: async () => {
      const response = await courseService.getPublishedCourses();
      return response.data;
    },
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM, // 2 minutes cache
    gcTime: CACHE_CONFIG.GC_TIME.LONG,        // 30 minutes in memory
    retry: CACHE_CONFIG.RETRY.IMPORTANT,      // 2 retries for important data
    refetchOnWindowFocus: false,              // Don't refetch on focus
    refetchOnMount: false,                    // Use cache when mounting
  });
};

/**
 * Hook to get courses the user is enrolled in
 */
export const useEnrolledCourses = () => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.ENROLLED_COURSES,
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.getEnrolledCourses(token || undefined);
      return response.data;
    },
    enabled: isSignedIn,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    retry: false,
  });
};

/**
 * Hook to get course details by ID
 */
export const useCourseDetail = (courseId: string) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.getCourseById(courseId, token || undefined);
      return response.data;
    },
    enabled: !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
  });
};

/**
 * Hook to check course enrollment status
 */
export const useCourseEnrollment = (courseId: string) => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.COURSE_ENROLLMENT(courseId),
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.checkEnrollmentStatus(courseId, token || undefined);
      return response.data;
    },
    enabled: isSignedIn && !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME.SHORT,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    retry: false,
  });
};

/**
 * Hook to get course analytics (for creators)
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
    staleTime: CACHE_CONFIG.STALE_TIME.LONG,
    gcTime: CACHE_CONFIG.GC_TIME.LONG,
    retry: false,
  });
};

/**
 * Hook to create a new course
 */
export const useCreateCourse = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (courseData: CreateCourseRequest) => {
      const token = await getToken();
      const response = await courseService.createCourse(courseData, token || undefined);
      return response.data;
    },
    onSuccess: (newCourse) => {
      // Invalidate creator courses to show the new course
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CREATOR_COURSES,
      });

      toast.success('Course created successfully!');
      router.push(`/creator/courses/${newCourse.id}/edit`);
    },
    onError: (error) => {
      console.error('Failed to create course:', error);
      toast.error('Failed to create course. Please try again.');
    },
  });
};

/**
 * Hook to update an existing course
 */
export const useUpdateCourse = (courseId: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseData: UpdateCourseFormData) => {
      const token = await getToken();
      const response = await courseService.updateCourse(courseId, courseData, token || undefined);
      return response.data;
    },
    onSuccess: (updatedCourse) => {
      // Update the cached course data
      queryClient.setQueryData(QUERY_KEYS.COURSE_DETAIL(courseId), updatedCourse);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CREATOR_COURSES,
      });

      if (updatedCourse.isPublished) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.PUBLISHED_COURSES,
        });
      }

      toast.success('Course updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course. Please try again.');
    },
  });
};

/**
 * Hook to delete a course
 */
export const useDeleteCourse = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const token = await getToken();
      await courseService.deleteCourse(courseId, token || undefined);
      return courseId;
    },
    onSuccess: (deletedCourseId) => {
      // Remove from all relevant caches
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.COURSE_DETAIL(deletedCourseId),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CREATOR_COURSES,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PUBLISHED_COURSES,
      });

      toast.success('Course deleted successfully!');
      router.push('/creator/courses');
    },
    onError: (error) => {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course. Please try again.');
    },
  });
};
