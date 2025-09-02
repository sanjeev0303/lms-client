/**
 * Progress-related React Query hooks with optimized caching and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { progressService } from '@/lib/api/services';
import { QUERY_KEYS, CACHE_CONFIG } from '@/lib/constants/api';

/**
 * Hook to get progress for all lectures in a course
 */
export const useCourseProgress = (courseId: string) => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.COURSE_PROGRESS(courseId),
    queryFn: async () => {
      const token = await getToken();
      const response = await progressService.getCourseProgress(courseId, token || undefined);
      return response.data;
    },
    enabled: isSignedIn && !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME.SHORT, // Progress updates frequently
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    retry: false,
  });
};

/**
 * Hook to get progress for a specific lecture
 */
export const useLectureProgress = (lectureId: string) => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.LECTURE_PROGRESS(lectureId),
    queryFn: async () => {
      const token = await getToken();
      const response = await progressService.getLectureProgress(lectureId, token || undefined);
      return response.data;
    },
    enabled: isSignedIn && !!lectureId,
    staleTime: CACHE_CONFIG.STALE_TIME.SHORT,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    retry: false,
  });
};

/**
 * Hook to update lecture progress with optimistic updates
 */
export const useUpdateLectureProgress = (lectureId: string, courseId: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progressData: { isCompleted?: boolean; watchedDuration?: number }) => {
      const token = await getToken();
      const response = await progressService.updateLectureProgress(
        lectureId,
        progressData,
        token || undefined
      );
      return response.data;
    },
    onSuccess: (updatedProgress) => {
      // Update cached lecture progress
      queryClient.setQueryData(QUERY_KEYS.LECTURE_PROGRESS(lectureId), updatedProgress);

      // Invalidate course progress to reflect changes
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_PROGRESS(courseId),
      });

      // Only show toast for completion events
      if (updatedProgress.isCompleted) {
        toast.success('Lecture completed!');
      }
    },
    onError: (error) => {
      console.error('Failed to update lecture progress:', error);
      // Don't show error toast for progress updates as they happen frequently
      // and might annoy users
    },
  });
};
