/**
 * Course Service
 * Handles all course-related API operations
 */

import { apiClient, createAuthenticatedApiClient } from '../client';
import { API_ENDPOINTS } from '@/lib/constants/api';
import type {
    Course,
    CreateCourseRequest,
    UpdateCourseFormData,
    CourseAnalytics,
    EnrollmentStatus,
    ApiResponse
} from '@/types/api';

export class CourseService {
    /**
     * Get courses created by the current user
     */
    static async getCreatorCourses(token?: string): Promise<ApiResponse<Course[]>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<Course[]>(API_ENDPOINTS.COURSE_CREATOR);
    }

    /**
     * Get all published courses (public endpoint)
     */
    static async getPublishedCourses(): Promise<ApiResponse<Course[]>> {
        return apiClient.get<Course[]>(API_ENDPOINTS.COURSE_PUBLISHED);
    }

    /**
     * Get courses the user is enrolled in
     */
    static async getEnrolledCourses(token?: string): Promise<ApiResponse<Course[]>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<Course[]>(API_ENDPOINTS.COURSE_ENROLLED);
    }

    /**
     * Get course by ID
     */
    static async getCourseById(courseId: string, token?: string): Promise<ApiResponse<Course>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<Course>(API_ENDPOINTS.COURSE_BY_ID(courseId));
    }

    /**
     * Create a new course
     */
    static async createCourse(
        courseData: CreateCourseRequest,
        token?: string
    ): Promise<ApiResponse<Course>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.post<Course>(API_ENDPOINTS.COURSE_CREATE, courseData);
    }

    /**
     * Update an existing course
     */
    static async updateCourse(
        courseId: string,
        courseData: UpdateCourseFormData,
        token?: string
    ): Promise<ApiResponse<Course>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;

        // Convert to FormData for file uploads
        const formData = new FormData();

        Object.entries(courseData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        return client.post<Course>(API_ENDPOINTS.COURSE_EDIT(courseId), formData, {
            timeout: 30000, // Extended timeout for file uploads
        });
    }

    /**
     * Delete a course
     */
    static async deleteCourse(courseId: string, token?: string): Promise<ApiResponse<void>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.delete<void>(API_ENDPOINTS.COURSE_DELETE(courseId));
    }

    /**
     * Check course enrollment status
     */
    static async checkEnrollmentStatus(
        courseId: string,
        token?: string
    ): Promise<ApiResponse<EnrollmentStatus>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<EnrollmentStatus>(API_ENDPOINTS.COURSE_ENROLLMENT(courseId));
    }

    /**
     * Get course analytics (for course creators)
     */
    static async getCourseAnalytics(
        courseId: string,
        token?: string
    ): Promise<ApiResponse<CourseAnalytics>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<CourseAnalytics>(API_ENDPOINTS.COURSE_ANALYTICS(courseId));
    }
}

export const courseService = CourseService;
