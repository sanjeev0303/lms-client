/**
 * Progress Service
 * Handles all lecture progress and tracking-related API operations
 */

import { apiClient, createAuthenticatedApiClient } from '../client';
import { API_ENDPOINTS } from '@/lib/constants/api';
import type {
    LectureProgress,
    CourseProgress,
    ApiResponse
} from '@/types/api';

export class ProgressService {
    /**
     * Get progress for all lectures in a course
     */
    static async getCourseProgress(courseId: string, token?: string): Promise<ApiResponse<CourseProgress>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<CourseProgress>(API_ENDPOINTS.PROGRESS_BY_COURSE(courseId));
    }

    /**
     * Get progress for a specific lecture
     */
    static async getLectureProgress(lectureId: string, token?: string): Promise<ApiResponse<LectureProgress>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<LectureProgress>(API_ENDPOINTS.PROGRESS_BY_LECTURE(lectureId));
    }

    /**
     * Update lecture progress (mark as complete, update watched duration, etc.)
     */
    static async updateLectureProgress(
        lectureId: string,
        progressData: {
            isCompleted?: boolean;
            watchedDuration?: number;
        },
        token?: string
    ): Promise<ApiResponse<LectureProgress>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.put<LectureProgress>(API_ENDPOINTS.PROGRESS_UPDATE(lectureId), progressData);
    }

    /**
     * Mark lecture as completed
     */
    static async completeLecture(
        lectureId: string,
        courseId: string,
        token?: string
    ): Promise<ApiResponse<LectureProgress>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.post<LectureProgress>(
            `/api/lecture-progress/lecture/${lectureId}/course/${courseId}/complete`,
            {}
        );
    }
}

export const progressService = ProgressService;
