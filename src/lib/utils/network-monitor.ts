'use client';

import React from 'react';

/**
 * Network Monitor Utility
 * Provides network connectivity detection and retry mechanisms
 * for handling intermittent network issues with external services like Cloudinary
 */

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  lastChecked: Date;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

class NetworkMonitor {
  private static instance: NetworkMonitor;
  private status: NetworkStatus;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();

  constructor() {
    this.status = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSlowConnection: false,
      lastChecked: new Date(),
    };

    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.performInitialCheck();
    }
  }

  static getInstance(): NetworkMonitor {
    if (typeof window === 'undefined') {
      // Return a basic instance for SSR
      return {
        getStatus: () => ({ isOnline: true, isSlowConnection: false, lastChecked: new Date() }),
        addListener: () => {},
        removeListener: () => {},
        checkConnection: async () => ({ isOnline: true, isSlowConnection: false, lastChecked: new Date() }),
        retryWithBackoff: async (fn: () => Promise<any>) => fn(),
      } as any;
    }

    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Monitor connection quality using Connection API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  private handleOnline(): void {
    this.updateStatus({ isOnline: true });
    this.performConnectivityTest();
  }

  private handleOffline(): void {
    this.updateStatus({ isOnline: false, isSlowConnection: false });
  }

  private handleConnectionChange(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const isSlowConnection = connection.effectiveType === 'slow-2g' ||
                              connection.effectiveType === '2g' ||
                              connection.downlink < 1.5;

      this.updateStatus({ isSlowConnection });
    }
  }

  private async performInitialCheck(): Promise<void> {
    await this.performConnectivityTest();
  }

  private async performConnectivityTest(): Promise<void> {
    try {
      // Test connectivity to Cloudinary
      const response = await fetch('https://res.cloudinary.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });

      this.updateStatus({ isOnline: true });
    } catch (error) {
      console.warn('Cloudinary connectivity test failed:', error);
      // Don't mark as offline unless we're sure
      if (navigator.onLine) {
        this.updateStatus({ isSlowConnection: true });
      }
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>): void {
    this.status = {
      ...this.status,
      ...updates,
      lastChecked: new Date(),
    };

    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  public getStatus(): NetworkStatus {
    return { ...this.status };
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Retry mechanism with exponential backoff for network requests
   */
  public async retryRequest<T>(
    requestFn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
    } = config;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Don't retry if we're offline
        if (!this.status.isOnline) {
          throw new Error('Network offline - not retrying');
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if a URL is likely to be problematic based on current network status
   */
  public shouldUseProxy(url: string): boolean {
    // Use proxy for Cloudinary if we're having connectivity issues
    if (url.includes('res.cloudinary.com') &&
        (!this.status.isOnline || this.status.isSlowConnection)) {
      return true;
    }

    return false;
  }
}

// Export singleton instance with lazy initialization
let networkMonitorInstance: NetworkMonitor | null = null;

export const networkMonitor = (() => {
  if (typeof window === 'undefined') {
    // Return a basic instance for SSR
    return {
      getStatus: () => ({ isOnline: true, isSlowConnection: false, lastChecked: new Date() }),
      subscribe: () => () => {},
      checkConnection: async () => ({ isOnline: true, isSlowConnection: false, lastChecked: new Date() }),
      retryWithBackoff: async (fn: () => Promise<any>) => fn(),
    } as any;
  }

  if (!networkMonitorInstance) {
    networkMonitorInstance = NetworkMonitor.getInstance();
  }
  return networkMonitorInstance;
})();

// Hook for React components
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(
    typeof window !== 'undefined'
      ? networkMonitor.getStatus()
      : { isOnline: true, isSlowConnection: false, lastChecked: new Date() }
  );

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      return networkMonitor.subscribe(setStatus);
    }
  }, []);

  return status;
}

// Helper function for image URLs with fallback
export function getOptimizedImageUrl(url: string, fallbackUrl: string): string {
  if (!url) return fallbackUrl;

  // If network is having issues with Cloudinary, use proxy
  if (networkMonitor.shouldUseProxy(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}&fallback=${encodeURIComponent(fallbackUrl)}`;
  }

  return url;
}

export default NetworkMonitor;
