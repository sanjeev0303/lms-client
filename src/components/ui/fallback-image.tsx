'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useNetworkStatus, getOptimizedImageUrl } from '@/lib/utils/network-monitor';

interface FallbackImageProps {
  src: string;
  alt: string;
  fallbackSrc: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  quality,
  placeholder,
  blurDataURL,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const networkStatus = useNetworkStatus();

  // Update image source when network status changes or src changes
  useEffect(() => {
    if (src && !hasError) {
      const optimizedSrc = getOptimizedImageUrl(src, fallbackSrc);
      setImageSrc(optimizedSrc);
    }
  }, [src, fallbackSrc, networkStatus, hasError]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);

      // Try proxy route first if original failed
      if (retryCount === 0 && src.includes('res.cloudinary.com')) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}&fallback=${encodeURIComponent(fallbackSrc)}`;
        setImageSrc(proxyUrl);
        setRetryCount(1);
        return;
      }

      // Fall back to local fallback image
      setImageSrc(fallbackSrc);
    }
  };

  const imageProps = {
    src: imageSrc,
    alt,
    className,
    onError: handleError,
    priority,
    ...(quality && { quality }),
    ...(placeholder && { placeholder }),
    ...(blurDataURL && { blurDataURL }),
    ...(sizes && { sizes }),
  };

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  return (
    <Image
      {...imageProps}
      width={width || 400}
      height={height || 300}
    />
  );
};
