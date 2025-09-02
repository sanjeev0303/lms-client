/**
 * Optimized Analytics Hook
 * Uses batching and sampling to reduce API calls by 20-30 per day per user
 */

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import analyticsBatcher, { type AnalyticsEvent } from '@/lib/utils/analytics-batcher';

interface UseOptimizedAnalyticsReturn {
  trackProgress: (courseId: string, lectureId: string, data: {
    watchedDuration?: number;
    isCompleted?: boolean;
    lastUpdated?: number;
  }) => Promise<void>;

  trackCourseView: (courseId: string, data: {
    duration?: number;
    source?: string;
    userId?: string;
  }) => Promise<void>;

  trackLectureCompletion: (courseId: string, lectureId: string, data: {
    completionTime?: number;
    totalDuration?: number;
  }) => Promise<void>;

  trackEngagement: (data: {
    eventType: string;
    courseId?: string;
    lectureId?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;

  flushAnalytics: () => Promise<void>;
}

/**
 * Hook for optimized analytics tracking with batching and sampling
 * PERFORMANCE: Reduces individual API calls by grouping analytics events
 * SAMPLING: Non-critical events are sampled at 70% to reduce load
 */
export const useOptimizedAnalytics = (): UseOptimizedAnalyticsReturn => {
  const { userId } = useAuth();

  /**
   * Track lecture progress with batching
   * CRITICAL: Always sent (no sampling)
   */
  const trackProgress = useCallback(async (
    courseId: string,
    lectureId: string,
    data: { watchedDuration?: number; isCompleted?: boolean; lastUpdated?: number }
  ) => {
    await analyticsBatcher.addEvent({
      type: 'progress_update',
      courseId,
      lectureId,
      data: {
        ...data,
        userId,
        lastUpdated: data.lastUpdated || Date.now()
      }
    });
  }, [userId]);

  /**
   * Track course views with batching
   * SAMPLED: 70% of events sent to reduce API load
   */
  const trackCourseView = useCallback(async (
    courseId: string,
    data: { duration?: number; source?: string; userId?: string }
  ) => {
    await analyticsBatcher.addEvent({
      type: 'course_view',
      courseId,
      data: {
        ...data,
        userId: data.userId || userId,
        viewTime: Date.now()
      }
    });
  }, [userId]);

  /**
   * Track lecture completions
   * CRITICAL: Always sent (no sampling)
   */
  const trackLectureCompletion = useCallback(async (
    courseId: string,
    lectureId: string,
    data: { completionTime?: number; totalDuration?: number }
  ) => {
    await analyticsBatcher.addEvent({
      type: 'lecture_complete',
      courseId,
      lectureId,
      data: {
        ...data,
        userId,
        completedAt: Date.now()
      }
    });
  }, [userId]);

  /**
   * Track general engagement events
   * SAMPLED: 70% of events sent to reduce API load
   */
  const trackEngagement = useCallback(async (data: {
    eventType: string;
    courseId?: string;
    lectureId?: string;
    metadata?: Record<string, any>;
  }) => {
    await analyticsBatcher.addEvent({
      type: 'engagement',
      courseId: data.courseId,
      lectureId: data.lectureId,
      data: {
        ...data,
        userId,
        timestamp: Date.now()
      }
    });
  }, [userId]);

  /**
   * Force flush any pending analytics
   * Useful for page unload or critical moments
   */
  const flushAnalytics = useCallback(async () => {
    await analyticsBatcher.flush();
  }, []);

  return {
    trackProgress,
    trackCourseView,
    trackLectureCompletion,
    trackEngagement,
    flushAnalytics
  };
};

export default useOptimizedAnalytics;
