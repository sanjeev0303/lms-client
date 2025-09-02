/**
 * Server Status Component
 * Displays server health status and warnings to users
 */

"use client";

import React, { useEffect, useState } from 'react';
import { checkServerHealth, getCachedHealthStatus } from '@/lib/api/health-check';

interface ServerStatusProps {
    showWhenHealthy?: boolean;
    className?: string;
}

export function ServerStatus({ showWhenHealthy = false, className = '' }: ServerStatusProps) {
    const [healthStatus, setHealthStatus] = useState(getCachedHealthStatus());
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        let mounted = true;

        const performHealthCheck = async () => {
            if (!mounted) return;

            setIsChecking(true);
            try {
                const status = await checkServerHealth();
                if (mounted) {
                    setHealthStatus(status);
                }
            } catch (error) {
                console.warn('Health check failed:', error);
            } finally {
                if (mounted) {
                    setIsChecking(false);
                }
            }
        };

        // Only check once on mount if explicitly requested
        if (showWhenHealthy) {
            performHealthCheck();
        }

        // COST OPTIMIZATION: Removed automatic polling
        // Health checks are now only triggered:
        // 1. On component mount (if showWhenHealthy=true)
        // 2. On API errors (reactive checking)
        // 3. Manual refresh by user action
        // This reduces from 144 calls/day to ~1-5 calls/day per user

        return () => {
            mounted = false;
        };
    }, [showWhenHealthy]);

    // Don't show anything if we don't have status yet
    if (!healthStatus && !isChecking) {
        return null;
    }

    // Don't show when healthy unless explicitly requested
    if (healthStatus?.isHealthy && !showWhenHealthy) {
        return null;
    }

    const renderStatus = () => {
        if (isChecking && !healthStatus) {
            return (
                <div className={`border border-blue-200 bg-blue-50 p-4 rounded-lg ${className}`}>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-800 font-medium">Checking Server Status</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">Verifying server connectivity...</p>
                </div>
            );
        }

        if (!healthStatus) {
            return null;
        }

        if (healthStatus.isHealthy) {
            // Show warning for slow responses even when healthy
            const isSlowResponse = healthStatus.responseTime > 2000; // 2+ seconds is slow
            const isVerySlowResponse = healthStatus.responseTime > 4000; // 4+ seconds is very slow

            if (isVerySlowResponse || (isSlowResponse && showWhenHealthy)) {
                return (
                    <div className={`border border-amber-200 bg-amber-50 p-4 rounded-lg ${className}`}>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                            <span className="text-amber-800 font-medium">Server Slow</span>
                        </div>
                        <p className="text-amber-700 text-sm mt-1">
                            Server is responding slowly ({healthStatus.responseTime}ms). Some features may be delayed.
                        </p>
                    </div>
                );
            }

            if (!showWhenHealthy) return null;

            return (
                <div className={`border border-green-200 bg-green-50 p-4 rounded-lg ${className}`}>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                        <span className="text-green-800 font-medium">Server Online</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                        Server is responding normally ({healthStatus.responseTime}ms)
                    </p>
                </div>
            );
        }        // Server is unhealthy
        const isSlowResponse = healthStatus.responseTime > 3000; // Reduced threshold
        const isVerySlowResponse = healthStatus.responseTime > 5000;
        const isNetworkError = healthStatus.error?.includes('Failed to fetch') ||
                               healthStatus.error?.includes('network') ||
                               healthStatus.error?.includes('CORS');

        return (
            <div className={`border border-amber-200 bg-amber-50 p-4 rounded-lg ${className}`}>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                    <span className="text-amber-800 font-medium">
                        {isNetworkError ? 'Connection Issues' : 'Server Issues'}
                    </span>
                </div>
                <p className="text-amber-700 text-sm mt-1">
                    {isNetworkError ? (
                        'Having trouble connecting to the server. Please check your internet connection and try again.'
                    ) : isSlowResponse ? (
                        `Server is responding slowly (${healthStatus.responseTime}ms). Some features may be delayed.`
                    ) : (
                        `Server is experiencing issues. ${healthStatus.error || 'Please try again later.'}`
                    )}
                </p>
            </div>
        );
    };

    return renderStatus();
}

export default ServerStatus;
