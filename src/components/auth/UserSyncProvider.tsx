'use client'

import { useMe } from '@/hooks'
import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useMemo } from 'react'

/**
 * UserSyncProvider ensures user data is synchronized between Clerk and backend
 * This component should be placed high in the component tree to ensure
 * user data is available when the user logs in
 */
export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser()
  const { data: backendUser, refetch: refetchBackendUser } = useMe()

  const syncUser = useCallback(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      refetchBackendUser()
    }
  }, [isLoaded, isSignedIn, clerkUser?.id])

  useEffect(() => {
    syncUser()
  }, [syncUser])

  return <>{children}</>
}

/**
 * Hook to get both Clerk and backend user data
 * Provides a unified interface for user data across the app
 */
export function useUnifiedUser() {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser()
  const { data: backendUser, isLoading: isBackendLoading, error: backendError, refetch } = useMe()

  const isAuthenticated = isSignedIn && isLoaded
  const isLoading = !isLoaded || (isAuthenticated && isBackendLoading)

  // Memoize user data to prevent unnecessary re-renders
  const user = useMemo(() => {
    return backendUser || (clerkUser ? {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      imageUrl: clerkUser.imageUrl,
      role: 'STUDENT' as const // Default role for new users
    } : null)
  }, [backendUser, clerkUser?.id, clerkUser?.firstName, clerkUser?.lastName, clerkUser?.primaryEmailAddress?.emailAddress, clerkUser?.imageUrl])

  return useMemo(() => ({
    user,
    clerkUser,
    backendUser,
    isAuthenticated,
    isLoading,
    error: backendError,
    refetch
  }), [user, clerkUser, backendUser, isAuthenticated, isLoading, backendError])
}
