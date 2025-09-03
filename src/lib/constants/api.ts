/**
 * API Configuration Constants
 * Centralized configuration for all API-related constants and endpoints
 */

// Base URLs for different environments
const getApiBaseUrl = (): string => {
    // Environment-specific API URLs
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Docker development setup
    if (process.env.NODE_ENV === 'development') {
        // Use nginx proxy in development for consistency
        return typeof window !== 'undefined'
            ? `${process.env.NEXT_PUBLIC_API_URL}`  // Browser: use nginx proxy
            : `${process.env.NEXT_PUBLIC_API_URL}`;  // Server-side: direct access
    }

    // Production fallback
    return process.env.SERVER_URL || `${process.env.NEXT_PUBLIC_API_URL}`;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_PREFIX = '/api';
export const COURSE_PREFIX = '/course';
export const LECTURE_PREFIX = '/lecture';
export const ORDER_PREFIX = '/order';
export const USER_PREFIX = '/user';
export const LECTURE_PROGRESS_PREFIX = '/lecture-progress';

// Complete API endpoints
export const API_ENDPOINTS = {
    // Authentication & User
    ME: `${API_PREFIX}/me`,
    USER_PROFILE: `${API_PREFIX}${USER_PREFIX}/profile`,
    USER_VERIFY_PHONE: `${API_PREFIX}${USER_PREFIX}/verify-phone`,

    // Course Management
    COURSE_CREATE: `${COURSE_PREFIX}/create`,
    COURSE_CREATOR: `${COURSE_PREFIX}/creator-courses`,
    COURSE_PUBLISHED: `${COURSE_PREFIX}/published`,
    COURSE_ENROLLED: `${COURSE_PREFIX}/enrolled`,
    COURSE_BY_ID: (courseId: string) => `${COURSE_PREFIX}/${courseId}`,
    COURSE_EDIT: (courseId: string) => `${COURSE_PREFIX}/editcourse/${courseId}`,
    COURSE_DELETE: (courseId: string) => `${COURSE_PREFIX}/${courseId}`,
    COURSE_ENROLLMENT: (courseId: string) => `${COURSE_PREFIX}/${courseId}/enrollment`,
    COURSE_ANALYTICS: (courseId: string) => `${COURSE_PREFIX}/${courseId}/analytics`,

    // Lecture Management
    LECTURE_CREATE: (courseId: string) => `${LECTURE_PREFIX}/create-lecture/${courseId}`,
    LECTURE_BY_COURSE: (courseId: string) => `${LECTURE_PREFIX}/lectures/${courseId}`,
    LECTURE_BY_ID: (lectureId: string) => `${LECTURE_PREFIX}/${lectureId}`,
    LECTURE_UPDATE: (lectureId: string) => `${LECTURE_PREFIX}/${lectureId}`,
    LECTURE_DELETE: (lectureId: string) => `${LECTURE_PREFIX}/${lectureId}`,
    LECTURE_REORDER: (courseId: string) => `${LECTURE_PREFIX}/reorder/${courseId}`,

    // Payment & Orders
    ORDER_CREATE: `${ORDER_PREFIX}/create-order`,
    ORDER_VERIFY: `${ORDER_PREFIX}/verify-payment`,

    // Progress Tracking
    PROGRESS_BY_COURSE: (courseId: string) => `${API_PREFIX}${LECTURE_PROGRESS_PREFIX}/course/${courseId}`,
    PROGRESS_BY_LECTURE: (lectureId: string) => `${API_PREFIX}${LECTURE_PROGRESS_PREFIX}/lecture/${lectureId}`,
    PROGRESS_UPDATE: (lectureId: string) => `${API_PREFIX}${LECTURE_PROGRESS_PREFIX}/lecture/${lectureId}`,
} as const;

// Request timeout configurations (now reads from environment)
export const REQUEST_TIMEOUT = {
    DEFAULT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '8000', 10),   // 8 seconds default (increased for server stability)
    FAST: 3000,      // 3 seconds for quick operations
    UPLOAD: 30000,   // 30 seconds for file uploads
    DOWNLOAD: 60000, // 60 seconds for downloads
} as const;

// Cache configurations for React Query (optimized for slow server)
export const CACHE_CONFIG = {
    STALE_TIME: {
        INSTANT: 0,                  // No caching for real-time data
        SHORT: 60 * 1000,           // 1 minute (increased to reduce server load)
        MEDIUM: 5 * 60 * 1000,      // 5 minutes (increased from 2 minutes)
        LONG: 15 * 60 * 1000,       // 15 minutes (increased from 5 minutes)
        VERY_LONG: 60 * 60 * 1000,  // 1 hour (increased from 30 minutes)
    },
    GC_TIME: {
        DEFAULT: 5 * 60 * 1000,     // 5 minutes
        LONG: 30 * 60 * 1000,       // 30 minutes
        PERMANENT: Infinity,        // Never garbage collect
    },
    RETRY: {
        DEFAULT: parseInt(process.env.NEXT_PUBLIC_RETRY_ATTEMPTS || '2', 10), // Use environment variable
        IMPORTANT: 3,              // For critical operations
        NONE: 0,                   // No retries for fast operations
    },
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
    // User related
    CURRENT_USER: ['currentUser'] as const,
    USER_PROFILE: ['userProfile'] as const,

    // Course related
    CREATOR_COURSES: ['creatorCourses'] as const,
    PUBLISHED_COURSES: ['publishedCourses'] as const,
    ENROLLED_COURSES: ['enrolledCourses'] as const,
    COURSE_DETAIL: (courseId: string) => ['courseDetail', courseId] as const,
    COURSE_ANALYTICS: (courseId: string) => ['courseAnalytics', courseId] as const,
    COURSE_ENROLLMENT: (courseId: string) => ['courseEnrollment', courseId] as const,

    // Lecture related
    COURSE_LECTURES: (courseId: string) => ['courseLectures', courseId] as const,
    LECTURE_DETAIL: (lectureId: string) => ['lectureDetail', lectureId] as const,

    // Progress related
    COURSE_PROGRESS: (courseId: string) => ['courseProgress', courseId] as const,
    LECTURE_PROGRESS: (lectureId: string) => ['lectureProgress', lectureId] as const,
} as const;
