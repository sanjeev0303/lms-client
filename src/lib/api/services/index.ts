/**
 * API Services Barrel Export
 * Centralized export for all API services
 */

export { UserService, userService } from './user.service';
export { CourseService, courseService } from './course.service';
export { LectureService, lectureService } from './lecture.service';
export { PaymentService, paymentService } from './payment.service';
export { ProgressService, progressService } from './progress.service';

// Re-export API client and types for convenience
export { apiClient, createAuthenticatedApiClient, ApiClientError } from '../client';
export type { ApiResponse, ApiError } from '@/types/api';
