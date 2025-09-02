/**
 * API Response Types
 * Centralized type definitions for all API responses and requests
 */

// Base API Response structure
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// Error Response structure
export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
    details?: any;
}

// User related types
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    clerkId?: string;
    phoneNumber?: string;
    plan?: string;
    role?: string;
    imageUrl?: string;
    photoUrl?: string; // Additional property for compatibility
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile extends User {
    bio?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
}

// Course related types
export interface Course {
    id: string;
    title: string;
    subTitle?: string; // Additional property for compatibility
    description?: string;
    category: string;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCE"; // Additional property for compatibility
    price: number;
    isPublished: boolean;
    thumbnail?: string;
    creatorId: string;
    creator?: User & { name?: string }; // Extended creator with name property
    lectures?: Lecture[];
    enrollmentCount?: number;
    rating?: number;
    totalDuration?: number;
    _count?: { // Additional property for compatibility
        lectures: number;
        enrollments: number;
        orders?: number;
    };
    orders?: any[]; // Additional property for compatibility
    revenue?: number; // Additional property for compatibility
    reviews?: unknown[]; // Additional property for compatibility
    createdAt: string;
    updatedAt: string;
}

export interface CreateCourseRequest {
    title: string;
    category: string;
}

export interface UpdateCourseRequest {
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    isPublished?: boolean;
    thumbnail?: File;
}

// Lecture related types
export interface Lecture {
    id: string;
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: number | string;
    order: number;
    isPublished: boolean;
    isFree?: boolean; // Additional property for compatibility
    courseId: string;
    course?: Course;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLectureRequest {
    title: string;
}

export interface UpdateLectureRequest {
    title?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
    isPublished?: boolean;
}

// Progress related types
export interface LectureProgress {
    id: string;
    userId: string;
    lectureId: string;
    courseId: string;
    isCompleted: boolean;
    watchedDuration: number;
    lastWatchedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface CourseProgress {
    courseId: string;
    totalLectures: number;
    completedLectures: number;
    progressPercentage: number;
    lastAccessedAt: string;
    lectures: LectureProgress[];
}

// Payment related types
export interface PaymentOrder {
    id: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    courseId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePaymentOrderRequest {
    courseId: string;
}

export interface VerifyPaymentRequest {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    courseId: string;
}

// Enrollment related types
export interface CourseEnrollment {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: string;
    course?: Course;
}

export interface EnrollmentStatus {
    isEnrolled: boolean;
    enrolledAt?: string;
}

// Analytics types
export interface CourseAnalytics {
    courseId: string;
    totalEnrollments: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
    monthlyEnrollments: {
        month: string;
        count: number;
    }[];
    recentEnrollments: {
        id: string;
        user: User;
        enrolledAt: string;
    }[];
}

// Form data types for multipart requests
export interface UpdateProfileFormData {
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    phoneNumber?: string;
    plan?: string;
    role?: string;
    profileImage?: File;
}

export interface UpdateCourseFormData {
    title?: string;
    subTitle?: string;    // Added missing subTitle field
    description?: string;
    category?: string;
    level?: string;       // Added missing level field
    price?: string;
    isPublished?: string;
    thumbnail?: File;
}
