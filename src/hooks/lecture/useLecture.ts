/**
 * Lecture-related React Query hooks with optimized caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { lectureService } from '@/lib/api/services';
import { QUERY_KEYS, CACHE_CONFIG } from '@/lib/constants/api';
import type { CreateLectureRequest, UpdateLectureRequest } from '@/types/api';

/**
 * Hook to get all lectures for a course
 */
export const useCourseLectures = (courseId: string) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.COURSE_LECTURES(courseId),
    queryFn: async () => {
      const token = await getToken();
      const response = await lectureService.getCourseLectures(courseId, token || undefined);
      // Normalize payload to always return an array of lectures
      const payload: any = response.data;
      const rawLectures: any[] = Array.isArray(payload) ? payload : payload?.lectures || [];
      return rawLectures.map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description ?? '',
        content: l.content,
        videoUrl: l.videoUrl,
        duration: l.duration,
        order: l.order ?? l.position ?? 0,
        isPublished: l.isPublished ?? false,
        isFree: l.isFree ?? false,
        courseId: l.courseId,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }));
    },
    enabled: !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
  });
};

/**
 * Hook to get lecture details by ID
 */
export const useLectureById = (lectureId: string) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.LECTURE_DETAIL(lectureId),
    queryFn: async () => {
      const token = await getToken();
      const response = await lectureService.getLectureById(lectureId, token || undefined);
      // Normalize payload: server returns { lecture: {...} }
      const payload: any = response.data;
      const l = (payload && (payload.lecture ?? payload)) as any;
      return {
        id: l.id,
        title: l.title,
        description: l.description ?? '',
        content: l.content,
        videoUrl: l.videoUrl,
        duration: l.duration,
        order: l.order ?? l.position ?? 0,
        isPublished: l.isPublished ?? false,
        isFree: l.isFree ?? false,
        courseId: l.courseId,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      };
    },
    enabled: !!lectureId,
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
  });
};

/**
 * Hook to create a new lecture
 */
export const useCreateLecture = (courseId: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureData: CreateLectureRequest) => {
      const token = await getToken();
      const response = await lectureService.createLecture(courseId, lectureData, token || undefined);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate course lectures to show the new lecture
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_LECTURES(courseId),
      });

      // Also invalidate course details as it might affect lecture count
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
      });

      toast.success('Lecture created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create lecture:', error);
      toast.error('Failed to create lecture. Please try again.');
    },
  });
};

/**
 * Hook to update an existing lecture
 */
export const useUpdateLecture = (lectureId: string, courseId: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureData: UpdateLectureRequest | FormData) => {
      const token = await getToken();
      const response = await lectureService.updateLecture(lectureId, lectureData, token || undefined);
      return response.data;
    },
    onSuccess: (updatedLecture) => {
      // Update the cached lecture data
      queryClient.setQueryData(QUERY_KEYS.LECTURE_DETAIL(lectureId), updatedLecture);

      // Invalidate course lectures list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_LECTURES(courseId),
      });

      toast.success('Lecture updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update lecture:', error);
      toast.error('Failed to update lecture. Please try again.');
    },
  });
};

/**
 * Hook to delete a lecture
 */
export const useDeleteLecture = (courseId: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureId: string) => {
      const token = await getToken();
      await lectureService.deleteLecture(lectureId, token || undefined);
      return lectureId;
    },
    onSuccess: (deletedLectureId) => {
      // Remove from lecture cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.LECTURE_DETAIL(deletedLectureId),
      });

      // Invalidate course lectures list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_LECTURES(courseId),
      });

      // Invalidate course details as lecture count changed
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_DETAIL(courseId),
      });

      toast.success('Lecture deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete lecture:', error);
      toast.error('Failed to delete lecture. Please try again.');
    },
  });
};

/**
 * Hook to reorder lectures
 */
export const useReorderLectures = (courseId: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureOrders: { id: string; position: number }[]) => {
      const token = await getToken();
      const response = await lectureService.reorderLectures(courseId, lectureOrders, token || undefined);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate course lectures to reflect new order
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE_LECTURES(courseId),
      });

      toast.success('Lectures reordered successfully!');
    },
    onError: (error) => {
      console.error('Failed to reorder lectures:', error);
      toast.error('Failed to reorder lectures. Please try again.');
    },
  });
};
