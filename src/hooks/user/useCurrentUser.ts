/**
 * User-related React Query hooks with optimized caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { userService } from '@/lib/api/services';
import { QUERY_KEYS, CACHE_CONFIG } from '@/lib/constants/api';
import type { UpdateProfileFormData, User } from '@/types/api';

// Extended User interface to match existing structure
export interface ExtendedUser extends User {
  clerkId?: string;
  phoneNumber?: string;
  plan?: string;
  role?: string;
  imageUrl?: string;
}

/**
 * Hook to get current authenticated user
 * Uses optimized caching with automatic token handling
 * Compatible with existing useMe hook functionality
 */
export const useCurrentUser = () => {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.CURRENT_USER,
    queryFn: async () => {
      const token = await getToken();
      const response = await userService.getCurrentUser(token || undefined);
      return response.data;
    },
    enabled: isSignedIn && typeof window !== 'undefined',
    staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    retry: false, // Don't retry auth failures
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

/**
 * Alias for useCurrentUser to maintain backward compatibility
 */
export const useMe = useCurrentUser;

/**
 * Hook to update user profile with optimistic updates
 */
export const useUpdateProfile = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UpdateProfileFormData) => {
      const token = await getToken();
      const response = await userService.updateProfile(profileData, token || undefined);
      return response.data;
    },
    onMutate: async (newData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CURRENT_USER });

      // Get previous data for rollback
      const previousData = queryClient.getQueryData(QUERY_KEYS.CURRENT_USER);

      // Optimistically update cache
      if (previousData) {
        queryClient.setQueryData(QUERY_KEYS.CURRENT_USER, (old: any) => ({
          ...old,
          ...newData,
        }));
      }

      return { previousData };
    },
    onSuccess: (updatedUser) => {
      // Update the cached user data
      queryClient.setQueryData(QUERY_KEYS.CURRENT_USER, updatedUser);

      // Invalidate related queries that might be affected
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.USER_PROFILE
      });

      toast.success('Profile updated successfully');
    },
    onError: (error, newData, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.CURRENT_USER, context.previousData);
      }

      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
    },
  });
};
