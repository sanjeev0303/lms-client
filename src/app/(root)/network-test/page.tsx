'use client';

import React from 'react';
import { FallbackImage } from '@/components/ui/fallback-image';
import { useNetworkStatus } from '@/lib/utils/network-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

/**
 * Network Test Page
 * Demonstrates the network resilience improvements for Cloudinary and other external images
 */
export default function NetworkTestPage() {
  const networkStatus = useNetworkStatus();

  const testImages = [
    {
      name: 'Cloudinary Test Image',
      src: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      fallback: '/default-course-thumbnail.svg',
      description: 'Tests Cloudinary connectivity with fallback'
    },
    {
      name: 'GitHub Avatar Test',
      src: 'https://avatars.githubusercontent.com/u/1?v=4',
      fallback: '/default-avatar.svg',
      description: 'Tests GitHub avatar loading with fallback'
    },
    {
      name: 'Intentionally Broken Image',
      src: 'https://nonexistent-domain-test-12345.com/image.jpg',
      fallback: '/default-course-thumbnail.svg',
      description: 'Should immediately fall back to default image'
    },
    {
      name: 'Local Image Test',
      src: '/default-course-thumbnail.svg',
      fallback: '/default-avatar.svg',
      description: 'Local image that should always work'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Network Resilience Test Page
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              This page demonstrates the network connectivity improvements and image loading fallback mechanisms
              implemented to resolve Cloudinary DNS issues and other network connectivity problems.
            </p>
          </div>

          {/* Network Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {networkStatus.isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={networkStatus.isOnline ? "default" : "destructive"}>
                    {networkStatus.isOnline ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-1" />
                    )}
                    {networkStatus.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={networkStatus.isSlowConnection ? "secondary" : "outline"}>
                    {networkStatus.isSlowConnection ? 'Slow Connection' : 'Normal Speed'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Last checked: {networkStatus.lastChecked.toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Image Loading Tests</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Each image below tests different aspects of our network resilience improvements:
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testImages.map((image, index) => (
                  <div key={index} className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {image.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {image.description}
                      </p>

                      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <FallbackImage
                          src={image.src}
                          alt={image.name}
                          fallbackSrc={image.fallback}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>

                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
                        Source: {image.src}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features Implemented */}
          <Card>
            <CardHeader>
              <CardTitle>Network Resilience Features Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600 dark:text-green-400">✅ Completed Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Image proxy API route for problematic external images</li>
                    <li>• Network status monitoring and detection</li>
                    <li>• Automatic fallback to local images on network errors</li>
                    <li>• Enhanced FallbackImage component with retry logic</li>
                    <li>• Cloudinary-specific error handling</li>
                    <li>• Image caching with appropriate cache headers</li>
                    <li>• DNS timeout handling and abort controllers</li>
                    <li>• Integration throughout the application (CourseCard, Profile, UserButton)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">🔧 How It Works</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Network monitor detects connectivity issues</li>
                    <li>• Images automatically use proxy when needed</li>
                    <li>• Exponential backoff retry mechanism</li>
                    <li>• Graceful degradation to fallback images</li>
                    <li>• Real-time network status updates</li>
                    <li>• Next.js Image optimization maintained</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Test */}
          <Card>
            <CardHeader>
              <CardTitle>Image Proxy API Test</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test the image proxy endpoint directly:
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-mono">
                  GET /api/image-proxy?url=https://res.cloudinary.com/demo/image/upload/sample.jpg&fallback=/default-course-thumbnail.svg
                </p>
                <div className="mt-4 w-32 h-32 bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                  <FallbackImage
                    src="/api/image-proxy?url=https://res.cloudinary.com/demo/image/upload/sample.jpg&fallback=/default-course-thumbnail.svg"
                    alt="Proxy API Test"
                    fallbackSrc="/default-course-thumbnail.svg"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
