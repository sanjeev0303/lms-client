import * as z from 'zod'

// Auth schemas
export const signUpSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
})

export const signInSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

// Profile schemas
export const profileUpdateSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
        .optional()
        .or(z.literal('')),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
})

export const phoneVerificationSchema = z.object({
    phoneNumber: z
        .string()
        .min(1, 'Phone number is required')
        .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
})

// Export types
export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type PhoneVerificationFormData = z.infer<typeof phoneVerificationSchema>
