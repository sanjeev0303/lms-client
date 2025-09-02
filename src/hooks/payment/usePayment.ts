/**
 * Payment-related React Query hooks with optimized error handling
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { paymentService } from '@/lib/api/services';
import type { CreatePaymentOrderRequest, VerifyPaymentRequest } from '@/types/api';

/**
 * Hook to create a payment order for course enrollment
 */
export const useCreatePaymentOrder = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (orderData: CreatePaymentOrderRequest) => {
      const token = await getToken();
      const response = await paymentService.createPaymentOrder(orderData, token || undefined);
      return response.data;
    },
    onError: (error) => {
      console.error('Failed to create payment order:', error);
      toast.error('Failed to create payment order. Please try again.');
    },
  });
};

/**
 * Hook to verify payment after successful transaction
 */
export const useVerifyPayment = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (paymentData: VerifyPaymentRequest) => {
      const token = await getToken();
      const response = await paymentService.verifyPayment(paymentData, token || undefined);
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Payment verified successfully!');
      } else {
        toast.error(result.message || 'Payment verification failed.');
      }
    },
    onError: (error) => {
      console.error('Failed to verify payment:', error);
      toast.error('Failed to verify payment. Please contact support.');
    },
  });
};
