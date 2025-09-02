/**
 * Debounced Value Hook
 * Prevents excessive API calls during rapid user input (search, typeahead)
 * Reduces server load from real-time search by batching user input
 */

import { useState, useEffect } from 'react';

export interface DebouncedOptions {
  delay?: number;
  leading?: boolean; // Execute on the leading edge
  trailing?: boolean; // Execute on the trailing edge (default)
}

/**
 * Hook to debounce a value change
 * Particularly useful for search inputs to prevent API spam
 */
export function useDebouncedValue<T>(
  value: T,
  options: DebouncedOptions = {}
): T {
  const { delay = 300, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (!trailing) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, trailing]);

  // Handle leading edge
  useEffect(() => {
    if (options.leading && value !== debouncedValue) {
      setDebouncedValue(value);
    }
  }, [value, debouncedValue, options.leading]);

  return debouncedValue;
}

/**
 * Hook for debounced callback execution
 * Useful for API calls that should be delayed until user stops typing
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
      setTimeoutId(null);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

/**
 * Specialized hook for search queries with abort controller
 * Automatically cancels previous requests when new search starts
 */
export function useDebouncedSearch(
  query: string,
  delay: number = 300
): {
  debouncedQuery: string;
  isDebouncing: boolean;
  abortController: AbortController | null;
} {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    // Don't debounce empty queries
    if (!query.trim()) {
      setDebouncedQuery('');
      setIsDebouncing(false);
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      return;
    }

    setIsDebouncing(true);

    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }

    const newController = new AbortController();
    setAbortController(newController);

    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
      if (newController) {
        newController.abort();
      }
    };
  }, [query, delay]);

  return {
    debouncedQuery,
    isDebouncing,
    abortController,
  };
}

/**
 * Hook for throttling rapid function calls
 * Different from debouncing - executes at regular intervals instead of waiting for pause
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 1000
): T {
  const [lastRan, setLastRan] = useState<number>(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const throttledCallback = ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRan >= limit) {
      // Execute immediately if enough time has passed
      callback(...args);
      setLastRan(now);
    } else {
      // Schedule execution for when the limit period expires
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
        setLastRan(Date.now());
        setTimeoutId(null);
      }, limit - (now - lastRan));

      setTimeoutId(newTimeoutId);
    }
  }) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return throttledCallback;
}
