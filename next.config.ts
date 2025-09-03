import type { NextConfig } from "next";

// Import SSR polyfill to prevent "self is not defined" errors
import "./src/lib/utils/ssr-polyfill";

const nextConfig: NextConfig = {
    // TypeScript and ESLint configuration
    typescript: {
        ignoreBuildErrors: false, // Enable TypeScript checks in production
    },
    eslint: {
        ignoreDuringBuilds: true, // Ignore ESLint warnings in production builds
    },

    // Performance optimizations
    compress: true,
    poweredByHeader: false,

    // Production output configuration
    output: 'standalone',

    // Generate static sitemap
    generateBuildId: async () => {
        return `lms-${Date.now()}`;
    },

    // Experimental features for better performance
    experimental: {
        optimizePackageImports: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            'lucide-react',
            '@tanstack/react-query',
            '@clerk/nextjs',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            'react-hook-form',
            'zod',
        ],
        // Optimize font loading
        optimizeCss: true,
        // Improve bundle splitting
        esmExternals: true,
    },

    // External packages configuration
    serverExternalPackages: ['sharp'],

    // Externalize large dependencies to reduce bundle size
    transpilePackages: [
        '@clerk/nextjs',
        '@tanstack/react-query',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
    ],

    // Turbopack configuration (moved from experimental.turbo)
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
        // Resolve configuration to avoid font loading issues
        resolveAlias: {
            '@': './src',
        },
    },

    // Image optimization for production
    images: {
        formats: ['image/webp', 'image/avif'],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "img.clerk.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lms-server-lw51.onrender.com",
                pathname: "/**",
            },
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        minimumCacheTTL: 31536000, // Cache images for 1 year in production
        unoptimized: false,
        loader: 'default',
    },



    // Production webpack optimizations
    webpack: (config: any, { isServer, dev }: any) => {
        // Fix "self is not defined" error by preventing client-side code on server
        if (isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };

            // Exclude client-side modules from server bundle
            config.externals = config.externals || [];
            config.externals.push({
                '@dnd-kit/core': 'commonjs @dnd-kit/core',
                '@dnd-kit/sortable': 'commonjs @dnd-kit/sortable',
                '@dnd-kit/utilities': 'commonjs @dnd-kit/utilities',
            });
        }

        // Add global polyfill for self to prevent errors
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        } else {
            // Add DefinePlugin to define globals for server-side
            const { DefinePlugin } = require('webpack');
            config.plugins.push(
                new DefinePlugin({
                    'typeof self': JSON.stringify('undefined'),
                    'typeof window': JSON.stringify('undefined'),
                    'typeof document': JSON.stringify('undefined'),
                    'typeof navigator': JSON.stringify('undefined'),
                })
            );
        }

        // Production optimizations
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                usedExports: true,
                sideEffects: false,
                minimize: true,
                splitChunks: {
                    chunks: isServer ? 'async' : 'all',
                    minSize: 20000,
                    maxSize: 244000, // Split chunks larger than 244KB
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Framework chunk for React/Next.js
                        framework: {
                            chunks: 'all',
                            name: 'framework',
                            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                            priority: 40,
                            enforce: true,
                        },
                        // Clerk authentication
                        clerk: {
                            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                            name: 'clerk',
                            priority: 30,
                            chunks: isServer ? 'async' : 'all',
                            enforce: true,
                        },
                        // UI libraries
                        ui: {
                            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|lucide-react)[\\/]/,
                            name: 'ui',
                            priority: 25,
                            chunks: isServer ? 'async' : 'all',
                            enforce: true,
                        },
                        // Query libraries
                        query: {
                            test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
                            name: 'query',
                            priority: 20,
                            chunks: isServer ? 'async' : 'all',
                            enforce: true,
                        },
                        // DnD kit
                        dnd: {
                            test: /[\\/]node_modules[\\/](@dnd-kit)[\\/]/,
                            name: 'dnd',
                            priority: 15,
                            chunks: isServer ? 'async' : 'all',
                            enforce: true,
                        },
                        // Common vendor libraries
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendor',
                            priority: 10,
                            chunks: isServer ? 'async' : 'all',
                            minChunks: 2,
                        },
                        // Common application code
                        common: {
                            name: 'common',
                            minChunks: 2,
                            priority: 5,
                            chunks: 'all',
                            enforce: true,
                        },
                    },
                },
            };
        }

        // Handle font files and other assets
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            use: {
                loader: 'file-loader',
                options: {
                    publicPath: '/_next/static/fonts/',
                    outputPath: 'static/fonts/',
                },
            },
        });

        // Tree shaking for lodash and other large libraries
        config.resolve.alias = {
            ...config.resolve.alias,
            'lodash': 'lodash-es', // Use ES modules version for better tree shaking
        };

        // Bundle analyzer for development
        if (dev && process.env.ANALYZE === 'true') {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'server',
                    openAnalyzer: true,
                })
            );
        }

        return config;
    },

    // Enhanced security headers for production
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'https://lms-server-lw51.onrender.com',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                ],
            },
        ];
    },

    // Optimize redirects and rewrites
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
