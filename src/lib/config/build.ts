/**
 * Build-safe environment configuration
 * Provides fallbacks during the build process when environment variables might not be available
 */

// Build-time environment variable validation
const getEnvVar = (key: string, fallback: string = '') => {
  const value = process.env[key];

  // During build, some environment variables might not be available
  if (!value && process.env.NODE_ENV === 'production') {
    console.warn(`Environment variable ${key} is not set during build. Using fallback.`);
    return fallback;
  }

  return value || fallback;
};

export const buildConfig = {
  // Clerk configuration with build-safe fallbacks
  clerk: {
    publishableKey: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'build-fallback'),
    secretKey: getEnvVar('CLERK_SECRET_KEY', 'build-fallback'),
    signInUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    signUpUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_URL', '/sign-up'),
  },

  // API configuration
  api: {
    baseUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'https://lms-server-lw51.onrender.com'),
    timeout: parseInt(getEnvVar('NEXT_PUBLIC_API_TIMEOUT', '3000')),
  },

  // Feature flags
  features: {
    performanceMonitoring: getEnvVar('NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING', 'true') === 'true',
    prefetching: getEnvVar('NEXT_PUBLIC_ENABLE_PREFETCHING', 'true') === 'true',
    devtools: getEnvVar('NEXT_PUBLIC_ENABLE_DEVTOOLS', 'false') === 'true',
  }
};

export default buildConfig;
