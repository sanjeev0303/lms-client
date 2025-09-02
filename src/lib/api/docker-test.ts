/**
 * Docker API Connectivity Test
 * Use this to test and verify your Docker setup is working correctly
 */

import { apiClient, dockerUtils, ApiClient } from './client';

/**
 * Test API connectivity for Docker setup
 */
export async function testDockerConnectivity(): Promise<void> {
    console.log('🐳 Testing Docker API connectivity...\n');

    // Test both direct and proxy access
    const results = await dockerUtils.testConnectivity();

    console.log('\n📊 Connectivity Results:');
    console.log(`Direct API (localhost:5000): ${results.direct ? '✅ Working' : '❌ Failed'}`);
    console.log(`Nginx Proxy (localhost): ${results.proxy ? '✅ Working' : '❌ Failed'}`);

    if (results.direct && results.directResponse) {
        console.log('\n🔗 Direct API Response:', results.directResponse);
    }

    if (results.proxy && results.proxyResponse) {
        console.log('\n🌐 Proxy Response:', results.proxyResponse);
    }

    // Show current configuration
    const config = dockerUtils.getRecommendedConfig();
    console.log(`\n🎯 Recommended Configuration: ${config.baseURL}`);
    console.log(`📝 Reason: ${config.reason}`);

    // Test current client configuration
    console.log(`\n🔧 Current API Client URL: ${apiClient.getBaseURL()}`);

    try {
        const healthResponse = await apiClient.get('/health');
        console.log('✅ Current client health check successful:', healthResponse);
    } catch (error) {
        console.error('❌ Current client health check failed:', error);
    }
}

/**
 * Switch between different API configurations
 */
export function switchApiMode(mode: 'direct' | 'proxy' | 'auto'): void {
    switch (mode) {
        case 'direct':
            apiClient.useDirectAccess();
            break;
        case 'proxy':
            apiClient.useProxyAccess();
            break;
        case 'auto':
            dockerUtils.applyRecommendedConfig();
            break;
        default:
            console.error('Invalid mode. Use: direct, proxy, or auto');
    }
}

/**
 * Create a custom API client for testing
 */
export function createTestClient(baseURL: string): ApiClient {
    const testClient = new ApiClient(baseURL);
    console.log(`🧪 Created test client with URL: ${baseURL}`);
    return testClient;
}

/**
 * Quick health check function
 */
export async function quickHealthCheck(): Promise<boolean> {
    try {
        const response = await apiClient.get('/health');
        console.log('✅ Health check passed:', response);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error);
        return false;
    }
}

// Export for easy access in browser console
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).dockerTest = {
        testConnectivity: testDockerConnectivity,
        switchMode: switchApiMode,
        healthCheck: quickHealthCheck,
        createTestClient,
    };

    console.log('🛠️  Docker test utilities available on window.dockerTest');
    console.log('   - testConnectivity(): Test both direct and proxy access');
    console.log('   - switchMode("direct"|"proxy"|"auto"): Switch API mode');
    console.log('   - healthCheck(): Quick health check');
    console.log('   - createTestClient(url): Create custom test client');
}
