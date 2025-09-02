'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { UserSyncProvider } from './UserSyncProvider'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { theme } = useTheme()

  // Fallback Clerk JS URL if the default CDN is unreachable
  const clerkJSUrl = process.env.NEXT_PUBLIC_CLERK_JS_URL ||
    'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js'

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      clerkJSUrl={clerkJSUrl}
      appearance={{
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: theme === 'dark' ? '#1f2937' : '#ffffff',
          colorInputBackground: theme === 'dark' ? '#374151' : '#ffffff',
          colorInputText: theme === 'dark' ? '#f9fafb' : '#111827',
        },
        elements: {
          formButtonPrimary:
            'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
          socialButtonsBlockButton:
            'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800',
          card: 'shadow-lg',
        },
      }}
    >
      <UserSyncProvider>
        {children}
      </UserSyncProvider>
    </ClerkProvider>
  )
}
