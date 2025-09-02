/**
 * Phone Verification React Query hooks
 * Handles phone number verification for user profiles
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { userService } from '@/lib/api/services';

/**
 * Hook to verify phone number
 */
export const useVerifyPhone = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ phoneNumber }: { phoneNumber: string }) => {
      const token = await getToken();
      const response = await userService.verifyPhone({ phoneNumber }, token || undefined);
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Phone verification initiated. Please check your SMS.');
      } else {
        toast.error(result.message || 'Phone verification failed.');
      }
    },
    onError: (error) => {
      console.error('Failed to verify phone:', error);
      toast.error('Failed to initiate phone verification. Please try again.');
    },
  });
};
