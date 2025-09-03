/**
 * Clerk Configuration Helper
 * Handles missing environment variables during build process
 */

export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  secretKey: process.env.CLERK_SECRET_KEY || '',
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/',
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/',
};

// Validation for runtime (not build time)
export const validateClerkConfig = () => {
  if (typeof window !== 'undefined' && !clerkConfig.publishableKey) {
    console.warn('Clerk publishable key is missing. Authentication features may not work properly.');
  }
};

export default clerkConfig;
