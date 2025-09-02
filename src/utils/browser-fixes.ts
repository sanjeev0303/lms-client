// SVG and DOM utilities to fix common browser errors

export const fixSVGAttributes = () => {
    if (typeof window === 'undefined') return;

    // Fix SVG elements with invalid width/height attributes
    const svgElements = document.querySelectorAll('svg');

    svgElements.forEach(svg => {
        // Fix width attribute
        const width = svg.getAttribute('width');
        if (width === 'auto' || width === '' || (width && isNaN(Number(width)) && !width.includes('%') && !width.includes('px'))) {
            svg.removeAttribute('width');
            svg.style.width = 'auto';
        }

        // Fix height attribute
        const height = svg.getAttribute('height');
        if (height === 'auto' || height === '' || (height && isNaN(Number(height)) && !height.includes('%') && !height.includes('px'))) {
            svg.removeAttribute('height');
            svg.style.height = 'auto';
        }

        // Ensure viewBox is properly set if width/height are removed
        if (!svg.getAttribute('viewBox') && (!svg.getAttribute('width') || !svg.getAttribute('height'))) {
            // Try to get dimensions from style or set default
            const computedStyle = window.getComputedStyle(svg);
            const styleWidth = computedStyle.width;
            const styleHeight = computedStyle.height;

            if (styleWidth !== 'auto' && styleHeight !== 'auto') {
                const w = parseInt(styleWidth) || 24;
                const h = parseInt(styleHeight) || 24;
                svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
            } else {
                svg.setAttribute('viewBox', '0 0 24 24');
            }
        }
    });
};

export const suppressConsoleErrors = () => {
    if (typeof window === 'undefined') return;

    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter out known non-critical errors
    console.error = (...args) => {
        const message = args.join(' ');

        // Skip SVG attribute errors (they're visual only)
        if (message.includes('SVG') && (message.includes('width') || message.includes('height'))) {
            return;
        }

        // Skip ad blocker related errors
        if (message.includes('ERR_BLOCKED_BY_CLIENT') ||
            message.includes('lumberjack.razorpay.com') ||
            message.includes('sentry-cdn.com') ||
            message.includes('googleads') ||
            message.includes('doubleclick')) {
            return;
        }

        // Skip Razorpay feature warnings
        if (message.includes('Unrecognized feature') &&
            (message.includes('otp-credentials') || message.includes('web-share'))) {
            return;
        }

        // Call original error for everything else
        originalError.apply(console, args);
    };

    console.warn = (...args) => {
        const message = args.join(' ');

        // Skip known warnings
        if (message.includes('Unrecognized feature') ||
            message.includes('otp-credentials') ||
            message.includes('web-share')) {
            return;
        }

        originalWarn.apply(console, args);
    };

    // Return cleanup function
    return () => {
        console.error = originalError;
        console.warn = originalWarn;
    };
};

export const initializeBrowserFixes = () => {
    if (typeof window === 'undefined') return;

    // Fix SVG issues on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixSVGAttributes);
    } else {
        fixSVGAttributes();
    }

    // Fix SVG issues when new content is added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        // Fix SVGs in newly added content
                        if (element.tagName === 'SVG') {
                            const svg = element as SVGElement;
                            // Apply fixes to this specific SVG
                            const width = svg.getAttribute('width');
                            const height = svg.getAttribute('height');

                            if (width === 'auto') {
                                svg.removeAttribute('width');
                                svg.style.width = 'auto';
                            }
                            if (height === 'auto') {
                                svg.removeAttribute('height');
                                svg.style.height = 'auto';
                            }
                        } else {
                            // Check for SVGs in child elements
                            const svgs = element.querySelectorAll('svg');
                            svgs.forEach(svg => {
                                const width = svg.getAttribute('width');
                                const height = svg.getAttribute('height');

                                if (width === 'auto') {
                                    svg.removeAttribute('width');
                                    svg.style.width = 'auto';
                                }
                                if (height === 'auto') {
                                    svg.removeAttribute('height');
                                    svg.style.height = 'auto';
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Suppress non-critical console errors
    const cleanupConsole = suppressConsoleErrors();

    // Return cleanup function
    return () => {
        observer.disconnect();
        cleanupConsole?.();
    };
};

// Network error suppression for payment gateways
export const suppressPaymentGatewayErrors = () => {
    if (typeof window === 'undefined') return;

    // Intercept and handle network errors gracefully
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args);
            return response;
        } catch (error) {
            const url = args[0]?.toString() || '';

            // Silently handle known blocked requests
            if (url.includes('lumberjack.razorpay.com') ||
                url.includes('sentry-cdn.com') ||
                url.includes('googleads') ||
                url.includes('doubleclick')) {
                // Return a mock successful response for analytics/tracking
                return new Response('{}', {
                    status: 200,
                    statusText: 'OK',
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Re-throw for actual important requests
            throw error;
        }
    };

    // Return cleanup function
    return () => {
        window.fetch = originalFetch;
    };
};
