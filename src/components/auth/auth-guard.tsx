"use client"

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

const AuthGuard = ({ children, fallbackUrl = '/sign-in' }: AuthGuardProps) => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logger.auth(`Checking authentication...`, { isSignedIn, isLoaded });

    // Wait for auth to load
    if (!isLoaded) {
      logger.auth(`Still loading auth state...`);
      return;
    }

    // If not signed in, redirect to sign-in
    if (!isSignedIn) {
      logger.auth(`User not authenticated, redirecting`, { fallbackUrl });
      const currentPath = window.location.pathname;
      const redirectUrl = `${fallbackUrl}?redirect_url=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    logger.auth(`Access granted - user is authenticated`);
  }, [isSignedIn, isLoaded, router, fallbackUrl]);

  // Show loading state while checking
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please sign in to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  return <>{children}</>;
};

export default AuthGuard;
