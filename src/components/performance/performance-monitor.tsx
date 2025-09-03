/**
 * Performance Monitor Component
 * Monitors and reports large resource loading and performance issues
 */

import { useEffect } from 'react';
import { toast } from 'sonner';

interface PerformanceMonitorProps {
    enabled?: boolean;
    resourceSizeThreshold?: number; // in bytes
}

const LARGE_RESOURCE_THRESHOLD = 2 * 1024 * 1024; // 2MB threshold to reduce noise
const VERY_LARGE_RESOURCE = 15 * 1024 * 1024; // 15MB for warnings
const SLOW_RESOURCE_MS = 7000; // 7s slow threshold

export function PerformanceMonitor({
    enabled = true,
    resourceSizeThreshold = LARGE_RESOURCE_THRESHOLD
}: PerformanceMonitorProps) {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Monitor resource loading
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();

            entries.forEach((entry) => {
                const resourceEntry = entry as PerformanceResourceTiming;

                // Skip if not a video or resource size is tiny
                const isVideo = /\.(mp4|webm|m3u8|mpd)(\?|$)/i.test(entry.name);

                if (resourceEntry.transferSize && resourceEntry.transferSize > resourceSizeThreshold) {
                    const sizeMB = (resourceEntry.transferSize / 1024 / 1024).toFixed(2);
                    console.warn(`Large resource detected: ${entry.name} ${resourceEntry.transferSize}bytes (${sizeMB}MB)`);

                    // Only toast for very large videos
                    if (isVideo && resourceEntry.transferSize > VERY_LARGE_RESOURCE) {
                        toast.warning(`Large video detected (${sizeMB}MB). This may affect loading speed.`, {
                            duration: 4000,
                        });
                    }
                }

                // Slow loading
                if (entry.duration && entry.duration > SLOW_RESOURCE_MS) {
                    console.warn(`Slow resource loading: ${entry.name} took ${(entry.duration / 1000).toFixed(2)}s`);
                }
            });
        });

        // Observe resource timing
        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('PerformanceObserver not supported:', error);
        }

        // Monitor Core Web Vitals
        const webVitalsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                    const lcp = entry.startTime;
                    if (lcp > 4000) { // Poor LCP threshold
                        console.warn(`Poor Largest Contentful Paint: ${lcp.toFixed(2)}ms`);
                    }
                }

                if (entry.entryType === 'layout-shift') {
                    const cls = (entry as any).value;
                    if (cls > 0.25) { // Poor CLS threshold
                        console.warn(`Poor Cumulative Layout Shift: ${cls}`);
                    }
                }
            }
        });

        try {
            webVitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
        } catch (error) {
            console.warn('Web Vitals monitoring not supported:', error);
        }

        return () => {
            observer.disconnect();
            webVitalsObserver.disconnect();
        };
    }, [enabled, resourceSizeThreshold]);

    return null; // This component doesn't render anything
}

// Hook for manual performance monitoring
export function usePerformanceMonitoring() {
    const markStart = (name: string) => {
        if (typeof window !== 'undefined' && window.performance) {
            performance.mark(`${name}-start`);
        }
    };

    const markEnd = (name: string) => {
        if (typeof window !== 'undefined' && window.performance) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);

            const measure = performance.getEntriesByName(name, 'measure')[0];
            if (measure && measure.duration > 1000) { // Log operations taking >1s
                console.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
            }
        }
    };

    const measureVideoLoading = (videoUrl: string, startTime: number) => {
        const loadTime = performance.now() - startTime;
        if (loadTime > 3000) { // Video took more than 3 seconds to start
            console.warn(`Slow video loading: ${videoUrl} took ${(loadTime / 1000).toFixed(2)}s`);
            toast.warning('Video is taking longer than usual to load. Consider using a faster connection.', {
                duration: 4000,
            });
        }
    };

    return {
        markStart,
        markEnd,
        measureVideoLoading,
    };
}
