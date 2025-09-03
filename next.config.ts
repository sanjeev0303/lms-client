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
        ],
        // Optimize font loading
        optimizeCss: true,
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

    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "medium.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "external-content.duckduckgo.com",
                pathname: "/**",
            },
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
                hostname: "ui-avatars.com",
                pathname: "/**",
            },
            // Added GitHub avatar hosts
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "github.com",
                pathname: "/**",
            },
            // Add wildcard for testing (development only)
            {
                protocol: "https",
                hostname: "*",
                pathname: "/**",
            },
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 300, // Cache images for 5 minutes minimum
        unoptimized: false, // Keep optimization enabled
        loader: 'default',
    },



    // Bundle analyzer and webpack optimizations
    ...(process.env.ANALYZE === 'true' && {
        webpack: (config: any) => {
            if (process.env.NODE_ENV === 'development') {
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
    }),

    // Additional webpack optimizations for all builds
    webpack: (config: any, { isServer }: any) => {
        // Optimize font loading and resolve any font-related issues
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
        };

        // Add rule to handle font files properly
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

        return config;
    },

    // Security headers
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
                ],
            },
        ];
    },
};

export default nextConfig;
