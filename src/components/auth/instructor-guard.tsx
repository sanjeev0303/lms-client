"use client"

import { useCurrentUser } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface InstructorGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

const InstructorGuard = ({ children, fallbackUrl = '/' }: InstructorGuardProps) => {
  const { data: currentUser, isLoading, error } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    console.log(`🛡️  INSTRUCTOR GUARD: Checking access...`);
    console.log(`👤 INSTRUCTOR GUARD: User data:`, currentUser);
    console.log(`⏳ INSTRUCTOR GUARD: Loading: ${isLoading}`);
    console.log(`❌ INSTRUCTOR GUARD: Error:`, error);

    // Wait for user data to load
    if (isLoading) {
      console.log(`⏳ INSTRUCTOR GUARD: Still loading user data...`);
      return;
    }

    // If error or no user data, redirect
    if (error || !currentUser) {
      console.log(`🚫 INSTRUCTOR GUARD: No user data or error, redirecting to ${fallbackUrl}`);
      router.push(fallbackUrl);
      return;
    }

    // Check if user has INSTRUCTOR role
    if (currentUser.role !== 'INSTRUCTOR') {
      console.log(`🚫 INSTRUCTOR GUARD: User role '${currentUser.role}' is not INSTRUCTOR, redirecting to ${fallbackUrl}`);
      router.push(fallbackUrl);
      return;
    }

    console.log(`✅ INSTRUCTOR GUARD: Access granted - user is INSTRUCTOR`);
  }, [currentUser, isLoading, error, router, fallbackUrl]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error state if something went wrong
  if (error || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Access verification failed. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have the right role
  if (currentUser.role !== 'INSTRUCTOR') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 mb-4">
            <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This area is only accessible to instructors.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting you to the home page...
          </p>
        </div>
      </div>
    );
  }

  // If user is an instructor, render the protected content
  return <>{children}</>;
};

export default InstructorGuard;
