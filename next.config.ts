import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // TypeScript and ESLint configuration
    typescript: {
        ignoreBuildErrors: false, // Enable TypeScript checks in production
    },
    eslint: {
        ignoreDuringBuilds: false, // Enable ESLint checks in production
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
        ],
        // Optimize font loading
        optimizeCss: true,
        // Improve bundle splitting
        esmExternals: true,
    },

    // External packages configuration
    serverExternalPackages: ['sharp'],

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
        // Production optimizations
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                usedExports: true,
                sideEffects: false,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true,
                        },
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            priority: -10,
                            chunks: 'all',
                        },
                        react: {
                            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                            name: 'react',
                            priority: 20,
                            chunks: 'all',
                        },
                        clerk: {
                            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                            name: 'clerk',
                            priority: 15,
                            chunks: 'all',
                        },
                        radix: {
                            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                            name: 'radix',
                            priority: 10,
                            chunks: 'all',
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
