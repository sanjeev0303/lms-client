// SSR polyfill to prevent "self is not defined" errors
// This must be imported before any client-side code

if (typeof globalThis !== 'undefined') {
  // Ensure self is defined in server environments
  if (typeof globalThis.self === 'undefined') {
    (globalThis as any).self = globalThis;
  }

  // Ensure window is defined for compatibility with proper location polyfill
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = {
      location: {
        protocol: 'https:',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        origin: 'https://localhost:3000',
        href: 'https://localhost:3000/'
      },
      navigator: {
        onLine: true,
        userAgent: 'SSR'
      },
      document: {
        addEventListener: () => {},
        removeEventListener: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => ({
          addEventListener: () => {},
          removeEventListener: () => {},
          appendChild: () => {},
          removeChild: () => {},
          setAttribute: () => {},
          getAttribute: () => null,
          style: {}
        })
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      fetch: globalThis.fetch || (() => Promise.reject(new Error('Fetch not available in SSR')))
    };
  }
}

// For Node.js environments
if (typeof global !== 'undefined') {
  if (typeof (global as any).self === 'undefined') {
    (global as any).self = global;
  }

  if (typeof (global as any).window === 'undefined') {
    (global as any).window = {
      location: {
        protocol: 'https:',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        origin: 'https://localhost:3000',
        href: 'https://localhost:3000/'
      },
      navigator: {
        onLine: true,
        userAgent: 'SSR'
      },
      document: {
        addEventListener: () => {},
        removeEventListener: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => ({
          addEventListener: () => {},
          removeEventListener: () => {},
          appendChild: () => {},
          removeChild: () => {},
          setAttribute: () => {},
          getAttribute: () => null,
          style: {}
        })
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      fetch: global.fetch || (() => Promise.reject(new Error('Fetch not available in SSR')))
    };
  }
}

export {};
