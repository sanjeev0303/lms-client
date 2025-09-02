// Browser compatibility and error handling utilities for payments

export const checkBrowserCompatibility = (): string[] => {
    const issues: string[] = [];

    // Check for ad blockers with multiple detection methods
    if (typeof window !== 'undefined') {
        // Method 1: Test element detection
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox adBanner ad ads advertisement';
        testAd.style.position = 'absolute';
        testAd.style.left = '-10000px';
        testAd.style.height = '1px';
        testAd.style.width = '1px';
        document.body.appendChild(testAd);

        setTimeout(() => {
            if (testAd.offsetHeight === 0 || getComputedStyle(testAd).display === 'none') {
                issues.push('Ad blocker detected - may block payment gateway and analytics');
            }
            if (document.body.contains(testAd)) {
                document.body.removeChild(testAd);
            }
        }, 100);

        // Method 2: Check for blocked network requests
        try {
            fetch('https://googleads.g.doubleclick.net/pagead/id', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            }).catch(() => {
                if (!issues.some(issue => issue.includes('Ad blocker'))) {
                    issues.push('Network requests being blocked - disable ad blockers');
                }
            });
        } catch {
            // Fetch not available or blocked
        }
    }

    // Check for required browser features
    if (typeof window !== 'undefined') {
        if (!window.Promise) {
            issues.push('Browser does not support Promises - please update your browser');
        }
        if (!window.fetch) {
            issues.push('Browser does not support Fetch API - please update your browser');
        }
        if (!window.localStorage) {
            issues.push('Browser does not support localStorage - please enable storage');
        }

        // Check for third-party cookie support
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch {
            issues.push('Third-party storage blocked - please allow cookies for payments');
        }
    }

    return issues;
};

export const handlePaymentErrors = (error: unknown) => {
    console.error('Payment error:', error);

    // Common error messages
    const errorMessages: Record<string, string> = {
        'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
        'GATEWAY_ERROR': 'Payment gateway is temporarily unavailable. Please try again later.',
        'INVALID_KEY': 'Payment configuration error. Please contact support.',
        'SCRIPT_LOAD_ERROR': 'Failed to load payment gateway. Please disable ad blockers or try a different browser.',
        'BLOCKED_BY_CLIENT': 'Request blocked by browser/ad blocker. Please disable ad blockers and try again.',
        'USER_CANCELLED': 'Payment was cancelled by user.',
        'INSUFFICIENT_FUNDS': 'Insufficient funds in your account.',
        'CARD_DECLINED': 'Your card was declined. Please try a different payment method.',
        'EXPIRED_CARD': 'Your card has expired. Please use a different card.',
        'INVALID_CVV': 'Invalid CVV entered. Please check and try again.',
        'PROCESSING_ERROR': 'Payment processing failed. Please try again.',
        'ANALYTICS_BLOCKED': 'Payment analytics blocked - this may affect payment experience but should not prevent payment.',
        'SENTRY_BLOCKED': 'Error tracking blocked - payment functionality not affected.'
    };

    // Determine error type
    let errorType = 'PROCESSING_ERROR';

    if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = error.code as string;
        switch (errorCode) {
            case 'NETWORK_ERROR':
            case 'ERR_NETWORK':
            case 'ERR_BLOCKED_BY_CLIENT':
                errorType = 'BLOCKED_BY_CLIENT';
                break;
            case 'GATEWAY_ERROR':
                errorType = 'GATEWAY_ERROR';
                break;
            case 'BAD_REQUEST_ERROR':
                if ('description' in error && typeof error.description === 'string' && error.description.includes('key')) {
                    errorType = 'INVALID_KEY';
                }
                break;
            default:
                errorType = 'PROCESSING_ERROR';
        }
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message;
        if (errorMessage.includes('script') || errorMessage.includes('load')) {
            errorType = 'SCRIPT_LOAD_ERROR';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('blocked')) {
            errorType = 'BLOCKED_BY_CLIENT';
        } else if (errorMessage.includes('cancelled')) {
            errorType = 'USER_CANCELLED';
        }
    }

    return {
        type: errorType,
        message: errorMessages[errorType] || 'An unexpected error occurred. Please try again.'
    };
};

export const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.Razorpay) {
            resolve();
            return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('SCRIPT_LOAD_ERROR')));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('crossorigin', 'anonymous');

        script.onload = () => {
            if (window.Razorpay) {
                resolve();
            } else {
                reject(new Error('Razorpay script loaded but object not available'));
            }
        };

        script.onerror = () => {
            reject(new Error('SCRIPT_LOAD_ERROR'));
        };

        // Add timeout
        setTimeout(() => {
            if (!window.Razorpay) {
                reject(new Error('Script loading timeout'));
            }
        }, 15000);

        document.head.appendChild(script);
    });
};

// Add CSP-friendly script loading
export const addRazorpayScriptWithCSP = () => {
    // Add to head to help with CSP
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://checkout.razorpay.com';
    document.head.appendChild(link);

    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = 'https://checkout.razorpay.com';
    document.head.appendChild(dnsLink);
};
