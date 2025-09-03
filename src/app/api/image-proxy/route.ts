import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Proxy API Route
 * Handles image requests to external services with fallback mechanisms
 * Helps resolve network connectivity issues with Cloudinary and other image hosts
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');
  const fallbackUrl = searchParams.get('fallback');
  const timeout = parseInt(searchParams.get('timeout') || '5000');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LMS-Image-Proxy/1.0',
        'Accept': 'image/*',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // Validate content type
    if (!contentType?.startsWith('image/')) {
      throw new Error('Response is not an image');
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Create response with proper headers
    const proxyResponse = new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=7200', // Cache for 1-2 hours
        'X-Proxy-Cache': 'MISS',
        'X-Original-URL': imageUrl,
      },
    });

    return proxyResponse;

  } catch (error) {
    console.error('Image proxy error:', error);

    // If we have a fallback URL, try to fetch that
    if (fallbackUrl && fallbackUrl !== imageUrl) {
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          signal: AbortSignal.timeout(3000), // Shorter timeout for fallback
          headers: {
            'User-Agent': 'LMS-Image-Proxy-Fallback/1.0',
            'Accept': 'image/*',
          },
        });

        if (fallbackResponse.ok) {
          const fallbackContentType = fallbackResponse.headers.get('content-type');
          const fallbackBuffer = await fallbackResponse.arrayBuffer();

          return new NextResponse(fallbackBuffer, {
            status: 200,
            headers: {
              'Content-Type': fallbackContentType || 'image/jpeg',
              'Content-Length': fallbackBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=1800', // Shorter cache for fallback
              'X-Proxy-Cache': 'FALLBACK',
              'X-Original-URL': imageUrl,
              'X-Fallback-URL': fallbackUrl,
            },
          });
        }
      } catch (fallbackError) {
        console.error('Fallback image also failed:', fallbackError);
      }
    }

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to fetch image',
        details: error instanceof Error ? error.message : 'Unknown error',
        originalUrl: imageUrl,
        fallbackUrl: fallbackUrl || null,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// Optional: Add HEAD method for checking image availability
export async function HEAD(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
      headers: {
        'User-Agent': 'LMS-Image-Proxy-Head/1.0',
      },
    });

    return new NextResponse(null, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Content-Length': response.headers.get('content-length') || '0',
        'X-Original-Status': response.status.toString(),
      },
    });

  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Error': 'Network timeout or connectivity issue',
      },
    });
  }
}
