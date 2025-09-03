/**
 * Video Optimization Utilities
 * Handles video URL optimization for better performance and streaming
 */

// Type definition for connection properties
interface ConnectionInfo {
    effectiveType?: string;
    saveData?: boolean;
}

// Type definition for navigator with connection properties
interface NavigatorWithConnection extends Navigator {
    connection?: ConnectionInfo;
    mozConnection?: ConnectionInfo;
    webkitConnection?: ConnectionInfo;
}

// Video quality presets for different use cases
export const VIDEO_QUALITY_PRESETS = {
    // Low quality for slow connections (480p, reduced bitrate)
    low: {
        width: 854,
        height: 480,
        quality: 'auto:low',
        format: 'mp4',
        bitrate: '500k'
    },
    // Medium quality for standard connections (720p)
    medium: {
        width: 1280,
        height: 720,
        quality: 'auto:good',
        format: 'mp4',
        bitrate: '1000k'
    },
    // High quality for fast connections (1080p)
    high: {
        width: 1920,
        height: 1080,
        quality: 'auto:best',
        format: 'mp4',
        bitrate: '2000k'
    },
    // Adaptive streaming with multiple quality options
    adaptive: {
        quality: 'auto',
        streaming_profile: 'hd'
    }
} as const;

// Detect user's connection speed and device capabilities
export function getOptimalVideoQuality(): keyof typeof VIDEO_QUALITY_PRESETS {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check connection type if available
    const connection = (navigator as NavigatorWithConnection).connection ||
                      (navigator as NavigatorWithConnection).mozConnection ||
                      (navigator as NavigatorWithConnection).webkitConnection;

    if (connection) {
        const effectiveType = connection.effectiveType;
        const saveData = connection.saveData;

        // If user has data saver enabled, use low quality
        if (saveData) return 'low';

        // Adapt based on connection speed
        switch (effectiveType) {
            case '4g':
                return isMobile ? 'medium' : 'high';
            case '3g':
                return 'medium';
            case '2g':
            case 'slow-2g':
                return 'low';
            default:
                return 'medium';
        }
    }

    // Fallback based on device type
    return isMobile ? 'medium' : 'high';
}

// Transform Cloudinary URL for optimal delivery
export function optimizeCloudinaryVideo(url: string, quality?: keyof typeof VIDEO_QUALITY_PRESETS): string {
    if (!url || !url.includes('cloudinary.com')) {
        return url; // Return original URL if not a Cloudinary URL
    }

    try {
        const qualityPreset = quality || getOptimalVideoQuality();
        const preset = VIDEO_QUALITY_PRESETS[qualityPreset];

        // Parse the Cloudinary URL to extract components
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');

        if (uploadIndex === -1) return url; // Not a valid Cloudinary upload URL

        // Build transformation parameters
        const transformations = [];

        if (qualityPreset === 'adaptive') {
            // For adaptive streaming, use Cloudinary's auto optimization
            transformations.push('f_auto', 'q_auto:good', 'c_scale,w_1280');
        } else {
            // For specific quality presets
            const specificPreset = preset as { width: number; height: number; quality: string; format: string; bitrate?: string };
            transformations.push(
                `w_${specificPreset.width}`,
                `h_${specificPreset.height}`,
                `q_${specificPreset.quality}`,
                `f_${specificPreset.format}`,
                'c_scale' // Scale to fit dimensions
            );

            if (specificPreset.bitrate) {
                transformations.push(`br_${specificPreset.bitrate}`);
            }
        }

        // Add progressive streaming for better loading
        transformations.push('fl_progressive');

        // Insert transformations into the URL
        const transformationString = transformations.join(',');
        urlParts.splice(uploadIndex + 1, 0, transformationString);

        return urlParts.join('/');
    } catch (error) {
        console.warn('Failed to optimize Cloudinary video URL:', error);
        return url; // Return original URL if optimization fails
    }
}

// Generate multiple quality URLs for adaptive streaming
export function generateAdaptiveVideoSources(url: string): Array<{ src: string; quality: string; size?: string }> {
    if (!url || !url.includes('cloudinary.com')) {
        return [{ src: url, quality: 'auto' }];
    }

    return [
        {
            src: optimizeCloudinaryVideo(url, 'high'),
            quality: '1080p',
            size: '1920x1080'
        },
        {
            src: optimizeCloudinaryVideo(url, 'medium'),
            quality: '720p',
            size: '1280x720'
        },
        {
            src: optimizeCloudinaryVideo(url, 'low'),
            quality: '480p',
            size: '854x480'
        }
    ];
}

// Check if video should use progressive loading
export function shouldUseProgressiveLoading(url: string): boolean {
    // Use progressive loading for large files or slow connections
    const connection = (navigator as NavigatorWithConnection).connection;

    if (connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || connection.saveData)) {
        return true;
    }

    // Always use progressive loading for Cloudinary videos to reduce initial load
    return url.includes('cloudinary.com');
}

// Generate thumbnail URL from video URL
export function generateVideoThumbnail(url: string): string {
    if (!url || !url.includes('cloudinary.com')) {
        return ''; // No thumbnail for non-Cloudinary videos
    }

    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');

        if (uploadIndex === -1) return '';

        // Generate thumbnail transformations
        const thumbnailTransforms = [
            'f_jpg', // Convert to JPEG
            'q_auto:good', // Auto quality
            'w_640,h_360', // 16:9 aspect ratio thumbnail
            'c_fill', // Fill the dimensions
            'so_2' // Extract frame at 2 seconds
        ].join(',');

        urlParts.splice(uploadIndex + 1, 0, thumbnailTransforms);

        return urlParts.join('/');
    } catch (error) {
        console.warn('Failed to generate video thumbnail:', error);
        return '';
    }
}
