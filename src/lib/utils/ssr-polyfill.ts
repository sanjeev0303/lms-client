// SSR polyfill to prevent "self is not defined" errors
// This must be imported before any client-side code

if (typeof globalThis !== 'undefined') {
  // Ensure self is defined in server environments
  if (typeof globalThis.self === 'undefined') {
    (globalThis as any).self = globalThis;
  }

  // Ensure window is defined for compatibility
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
}

// For Node.js environments
if (typeof global !== 'undefined') {
  if (typeof (global as any).self === 'undefined') {
    (global as any).self = global;
  }

  if (typeof (global as any).window === 'undefined') {
    (global as any).window = global;
  }
}

export {};
