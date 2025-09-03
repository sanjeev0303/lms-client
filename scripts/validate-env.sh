#!/bin/bash

# Pre-build validation script for Vercel deployment
# Ensures all required environment variables are available

echo "🔍 Validating environment variables for deployment..."

# Check if running in Vercel environment
if [ "$VERCEL" = "1" ]; then
    echo "✅ Running in Vercel environment"

    # Validate critical environment variables
    if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
        echo "❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing"
        echo "Please set it in your Vercel project settings"
        exit 1
    else
        echo "✅ Clerk publishable key is configured"
    fi

    if [ -z "$CLERK_SECRET_KEY" ]; then
        echo "❌ CLERK_SECRET_KEY is missing"
        echo "Please set it in your Vercel project settings"
        exit 1
    else
        echo "✅ Clerk secret key is configured"
    fi

    if [ -z "$NEXT_PUBLIC_API_URL" ]; then
        echo "❌ NEXT_PUBLIC_API_URL is missing"
        echo "Please set it in your Vercel project settings"
        exit 1
    else
        echo "✅ API URL is configured: $NEXT_PUBLIC_API_URL"
    fi

    echo "🚀 All environment variables validated successfully"
else
    echo "🏠 Running in local environment"

    # Load local environment files
    if [ -f ".env.production" ]; then
        echo "✅ Found .env.production file"
        export $(cat .env.production | grep -v '^#' | xargs)
    fi

    if [ -f ".env.local" ]; then
        echo "✅ Found .env.local file"
        export $(cat .env.local | grep -v '^#' | xargs)
    fi
fi

echo "🎯 Environment validation complete"
