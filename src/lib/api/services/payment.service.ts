/**
 * Payment Service
 * Handles all payment and order-related API operations
 */

import { apiClient, createAuthenticatedApiClient } from '../client';
import { API_ENDPOINTS } from '@/lib/constants/api';
import type {
    PaymentOrder,
    CreatePaymentOrderRequest,
    VerifyPaymentRequest,
    ApiResponse
} from '@/types/api';

export class PaymentService {
    /**
     * Create a payment order for course enrollment
     */
    static async createPaymentOrder(
        orderData: CreatePaymentOrderRequest,
        token?: string
    ): Promise<ApiResponse<PaymentOrder>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.post<PaymentOrder>(API_ENDPOINTS.ORDER_CREATE, orderData);
    }

    /**
     * Verify payment after successful transaction
     */
    static async verifyPayment(
        paymentData: VerifyPaymentRequest,
        token?: string
    ): Promise<ApiResponse<{ success: boolean; message: string }>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.post<{ success: boolean; message: string }>(
            API_ENDPOINTS.ORDER_VERIFY,
            paymentData
        );
    }
}

export const paymentService = PaymentService;
