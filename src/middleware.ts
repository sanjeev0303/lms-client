// SSR polyfill to prevent "self is not defined" errors
import './lib/utils/ssr-polyfill';

import { clerkMiddleware } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

// Module-scope cache so it can persist between requests on the same runtime
const roleCache = new Map<string, { role: string; timestamp: number }>();
const ROLE_CACHE_TTL = 15 * 60 * 1000; // Increase to 15 minutes for better performance
const ROLE_CACHE_FALLBACK_TTL = 60 * 60 * 1000; // 1 hour fallback for server issues

export default clerkMiddleware(async (auth, request: NextRequest) => {
    const { userId, getToken } = await auth();
    const { pathname } = request.nextUrl;

    // Only dashboard/creator routes need role checks
    const needsRoleCheck = pathname.startsWith('/dashboard') || pathname.startsWith('/creator');

    // Fetch user role directly from database if user is authenticated
    let userRole: string | undefined;
    if (userId && needsRoleCheck) {
        try {
            // Check cache first
            const cached = roleCache.get(userId);
            if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
                userRole = cached.role;
                logger.middleware(`Using cached role for user`, { userId, userRole });
            } else {
                // Get the actual JWT token from Clerk
                const token = await getToken();
                if (!token) {
                    logger.middleware(`No JWT token available for user`, { userId });
                } else {
                    // Enhanced timeout and retry logic for unreliable server
                    let attempts = 0;
                    const maxAttempts = 1; // reduce retries to avoid repeated aborts

                    while (attempts < maxAttempts && !userRole) {
                        attempts++;
                        logger.middleware(`Attempting to fetch user role`, { userId, attempt: attempts, maxAttempts });

                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 4500); // increase timeout to reduce AbortError

                            try {
                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                    signal: controller.signal,
                                    cache: 'no-store',
                                });

                                clearTimeout(timeoutId);

                                if (response.ok) {
                                    const userData = await response.json();
                                    userRole = userData?.role;
                                    // Cache the role with longer TTL for unreliable server
                                    if (userRole) {
                                        roleCache.set(userId, { role: userRole, timestamp: Date.now() });
                                        logger.middleware(`Cached role for user`, { userId, userRole });
                                        break; // Exit retry loop on success
                                    }
                                } else {
                                    const errorText = await response.text();
                                    logger.middleware(`Error response from API`, { userId, status: response.status, error: errorText });
                                }
                            } catch (fetchError) {
                                clearTimeout(timeoutId);
                                throw fetchError;
                            }
                        } catch (fetchError) {
                            logger.middleware(`Network error on attempt`, { userId, attempt: attempts, error: fetchError });
                        }
                    }

                    // If all attempts failed, check if we have any cached role (even expired)
                    if (!userRole) {
                        const expiredCache = roleCache.get(userId);
                        if (expiredCache && Date.now() - expiredCache.timestamp < ROLE_CACHE_FALLBACK_TTL) {
                            userRole = expiredCache.role;
                            logger.middleware(`Using fallback cached role (server unreachable)`, { userId, userRole });
                        }
                    }
                }
            }
        } catch (error) {
            logger.middleware(`Error fetching user role`, { userId, error });
            // Continue without role to avoid blocking navigation
            userRole = undefined;
        }
    }

    // Public routes that don't require authentication
    const isPublicRoute =
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/sign-in') ||
        pathname.startsWith('/sign-up') ||
        pathname.startsWith('/sso-callback') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/verify-email') ||
        pathname === '/' ||
        pathname.startsWith('/course-detail'); // All course detail pages are public

    // Auth routes that should redirect if already logged in
    const isAuthRoute = pathname.startsWith('/sign-in') ||
        pathname.startsWith('/sign-up') ||
        pathname.startsWith('/sso-callback');

    // Protected routes that require authentication
    const isProtectedRoute = pathname.startsWith('/profile') ||
        pathname.startsWith('/my-learning') ||
        pathname.startsWith('/course-progress') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/creator'); // Add creator routes as protected

    // Dashboard routes that require INSTRUCTOR role (will be checked on page level)
    const isDashboardRoute = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/creator'); // Creator routes also require INSTRUCTOR role

    logger.middleware(`Route classification`, {
        pathname,
        isPublicRoute,
        isAuthRoute,
        isProtectedRoute,
        isDashboardRoute
    });

    // If user is authenticated and trying to access auth routes, redirect to home
    if (userId && isAuthRoute) {
        logger.middleware(`Authenticated user accessing auth route, redirecting to home`, { pathname });
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If route is public, allow access
    if (isPublicRoute && !isProtectedRoute) {
        logger.middleware(`Public route access granted`, { pathname });
        return NextResponse.next();
    }

    // If user is not authenticated and trying to access protected routes
    if (!userId && isProtectedRoute) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect_url', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // For authenticated users accessing protected routes
    if (userId && isProtectedRoute) {
        // Special handling for dashboard routes - require INSTRUCTOR role
        if (isDashboardRoute) {
            if (userRole !== 'INSTRUCTOR') {
                // If we couldn't determine the role due to server issues, allow access
                // but add a query parameter to indicate server connectivity issues
                if (userRole === undefined) {
                    logger.middleware(`Could not determine role due to server issues, allowing access with warning`, { pathname });
                    const url = new URL(request.url);
                    url.searchParams.set('server_warning', 'connectivity_issue');
                    return NextResponse.rewrite(url);
                }
                logger.middleware(`Access denied - insufficient role`, { pathname, userRole, required: 'INSTRUCTOR' });
                return NextResponse.redirect(new URL('/?error=access-denied&message=instructor-required', request.url));
            }
            logger.middleware(`Dashboard access granted for INSTRUCTOR user`, { pathname });
            return NextResponse.next();
        }
        logger.middleware(`Protected route access granted for authenticated user`, { pathname });
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api routes starting with /api (but include auth API routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
};
