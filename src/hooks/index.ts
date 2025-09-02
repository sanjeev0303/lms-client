/**
 * Barrel export for all hooks
 * Organized by domain for better maintainability
 */

// User hooks
export * from './user/useCurrentUser';

// Course hooks
export * from './course/useCourse';
export * from './course/useCourseView';

// Lecture hooks
export * from './lecture/useLecture';

// Payment hooks
export * from './payment/usePayment';

// Progress hooks
export * from './progress/useProgress';

// Utility hooks (keep existing ones that are still relevant)
export { useIsMobile } from './use-mobile';

// Backward compatibility exports
export { useCurrentUser, useMe, useUpdateProfile } from './user/useCurrentUser';
