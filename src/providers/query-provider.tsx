"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CACHE_CONFIG } from "@/lib/constants/api";
import { ApiClientError } from "@/lib/api/client";

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized for slow server - more aggressive caching, faster timeouts
            staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM, // 5 minutes (increased to reduce server load)
            gcTime: CACHE_CONFIG.GC_TIME.LONG,    // 30 minutes (increased for better caching)
            retry: (failureCount, error) => {
              // Don't retry on most 4xx and 5xx errors
              if (error instanceof ApiClientError) {
                const s = error.statusCode;
                if (s >= 500) return false;
                if (s >= 400 && s < 500 && s !== 408 && s !== 429) return false;
              }
              return failureCount < CACHE_CONFIG.RETRY.DEFAULT;
            },
            refetchOnWindowFocus: false,             // Prevent unnecessary refetches
            refetchOnMount: false,                   // Use cached data when available
            refetchOnReconnect: true,                // Refetch when reconnected
            retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000), // Faster retries
            networkMode: 'online',                   // Only run queries when online
          },
          mutations: {
            retry: (failureCount, error) => {
              // Avoid retrying writes on server/client errors except timeouts/rate limit
              if (error instanceof ApiClientError) {
                const s = error.statusCode;
                if (s >= 500) return false;
                if (s >= 400 && s < 500 && s !== 408 && s !== 429) return false;
              }
              return failureCount < 1; // At most 1 retry for mutations
            },
            retryDelay: (attemptIndex) => Math.min(750 * 2 ** attemptIndex, 3000), // Faster mutation retries
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

export default QueryProvider;
