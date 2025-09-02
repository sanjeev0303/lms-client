/**
 * User Service
 * Handles all user-related API operations
 */

import { API_ENDPOINTS } from '@/lib/constants/api';
import type {
    ApiResponse,
    UpdateProfileFormData,
    User,
    UserProfile
} from '@/types/api';
import { apiClient, createAuthenticatedApiClient } from '../client';

export class UserService {
    /**
     * Get current authenticated user
     */
    static async getCurrentUser(token?: string): Promise<ApiResponse<User>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.get<User>(API_ENDPOINTS.ME);
    }

    /**
     * Update user profile
     */
    static async updateProfile(
        profileData: UpdateProfileFormData,
        token?: string
    ): Promise<ApiResponse<UserProfile>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;

        // Convert to FormData if file upload is involved
        const formData = new FormData();

        Object.entries(profileData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        return client.put<UserProfile>(API_ENDPOINTS.USER_PROFILE, formData, {
            timeout: 30000, // Extended timeout for file uploads
        });
    }

    /**
     * Verify phone number
     */
    static async verifyPhone(
        data: { phoneNumber: string },
        token?: string
    ): Promise<ApiResponse<{ success: boolean; message: string }>> {
        const client = token ? createAuthenticatedApiClient(token) : apiClient;
        return client.post<{ success: boolean; message: string }>(API_ENDPOINTS.USER_VERIFY_PHONE, data);
    }
}

export const userService = UserService;
