/**
 * Lecture Service
 * Handles all lecture-related API operations
 */

import { apiClient, createAuthenticatedApiClient } from '../client';
import { API_ENDPOINTS, REQUEST_TIMEOUT } from '@/lib/constants/api';
import type {
    Lecture,
    CreateLectureRequest,
    UpdateLectureRequest,
    ApiResponse
} from '@/types/api';

export class LectureService {
    /**
     * Get all lectures for a course
     */
    static async getCourseLectures(courseId: string, token?: string): Promise<ApiResponse<Lecture[]>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<Lecture[]>(API_ENDPOINTS.LECTURE_BY_COURSE(courseId));
    }

    /**
     * Get lecture by ID
     */
    static async getLectureById(lectureId: string, token?: string): Promise<ApiResponse<Lecture>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<Lecture>(API_ENDPOINTS.LECTURE_BY_ID(lectureId));
    }

    /**
     * Create a new lecture
     */
    static async createLecture(
        courseId: string,
        lectureData: CreateLectureRequest,
        token?: string
    ): Promise<ApiResponse<Lecture>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.post<Lecture>(API_ENDPOINTS.LECTURE_CREATE(courseId), lectureData);
    }

    /**
     * Update an existing lecture (supports JSON and FormData with video)
     */
    static async updateLecture(
        lectureId: string,
        lectureData: UpdateLectureRequest | FormData,
        token?: string
    ): Promise<ApiResponse<Lecture>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        const isFormData = typeof FormData !== 'undefined' && lectureData instanceof FormData;
        return client.put<Lecture>(
            API_ENDPOINTS.LECTURE_UPDATE(lectureId),
            lectureData,
            {
                ...(isFormData ? { timeout: REQUEST_TIMEOUT.UPLOAD } : {}),
            }
        );
    }

    /**
     * Delete a lecture
     */
    static async deleteLecture(lectureId: string, token?: string): Promise<ApiResponse<void>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.delete<void>(API_ENDPOINTS.LECTURE_DELETE(lectureId));
    }
}

export const lectureService = LectureService;
