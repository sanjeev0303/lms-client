/**
 * Network Capture Script
 * Simulates typical user session and captures all API calls for baseline measurement
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class NetworkCapture {
    constructor() {
        this.requests = [];
        this.responses = [];
        this.browser = null;
        this.page = null;
        this.startTime = Date.now();
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI/automated runs
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable request interception
        await this.page.setRequestInterception(true);
        
        // Track all network requests
        this.page.on('request', (request) => {
            const url = request.url();
            
            // Only track API calls to our backend
            if (url.includes('localhost:5000') || 
                url.includes('/api/') || 
                url.includes('/course/') ||
                url.includes('/lecture/') ||
                url.includes('/order/') ||
                url.includes('/health')) {
                
                this.requests.push({
                    timestamp: Date.now() - this.startTime,
                    method: request.method(),
                    url: url,
                    headers: request.headers(),
                    postData: request.postData(),
                    resourceType: request.resourceType(),
                    fromCache: request.fromCache ? request.fromCache() : false
                });
                
                console.log(`📤 ${request.method()} ${url}`);
            }
            
            request.continue();
        });
        
        // Track responses
        this.page.on('response', (response) => {
            const url = response.url();
            
            if (url.includes('localhost:5000') || 
                url.includes('/api/') || 
                url.includes('/course/') ||
                url.includes('/lecture/') ||
                url.includes('/order/') ||
                url.includes('/health')) {
                
                this.responses.push({
                    timestamp: Date.now() - this.startTime,
                    method: response.request().method(),
                    url: url,
                    status: response.status(),
                    headers: response.headers(),
                    size: response.headers()['content-length'] || '0',
                    fromCache: response.fromCache(),
                    timing: response.timing()
                });
                
                console.log(`📥 ${response.status()} ${url} (${response.headers()['content-length'] || '?'} bytes)`);
            }
        });
        
        // Set viewport
        await this.page.setViewport({ width: 1280, height: 720 });
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async simulateTypicalUserSession() {
        console.log('🎬 Starting typical user session simulation...');
        
        try {
            // 1. Visit home page
            console.log('\n📍 Step 1: Visit home page');
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            await this.wait(3000);

            // 2. Sign in (if not already signed in)
            console.log('\n📍 Step 2: Authentication check');
            try {
                await this.page.waitForSelector('a[href*="sign-in"]', { timeout: 5000 });
                console.log('User not signed in, navigating to sign-in');
                await this.page.click('a[href*="sign-in"]');
                await this.wait(2000);
                // Note: Manual sign-in required for this session
                console.log('⚠️  Manual sign-in required - please sign in and press Enter to continue...');
                await new Promise(resolve => {
                    process.stdin.once('data', () => resolve());
                });
            } catch (e) {
                console.log('✅ User appears to be signed in');
            }

            // 3. Browse courses
            console.log('\n📍 Step 3: Browse published courses');
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            await this.wait(2000);

            // 4. Open course detail
            console.log('\n📍 Step 4: View course detail');
            try {
                const courseLinks = await this.page.$$('a[href*="/course-detail/"]');
                if (courseLinks.length > 0) {
                    await courseLinks[0].click();
                    await this.wait(4000); // Wait for all API calls to complete
                } else {
                    console.log('⚠️  No course links found, navigating manually');
                    await this.page.goto('http://localhost:3000/course-detail/test-course', { waitUntil: 'networkidle0' });
                }
            } catch (e) {
                console.log('⚠️  Course navigation failed:', e.message);
            }

            // 5. Check enrollment/start learning
            console.log('\n📍 Step 5: Check enrollment status');
            await this.wait(2000);
            
            try {
                // Look for enrollment button or learning button
                const enrollBtn = await this.page.$('button:contains("Enroll"), button:contains("Start Learning")');
                if (enrollBtn) {
                    console.log('Found enrollment/learning button');
                    // Don't actually click to avoid payment flow
                }
            } catch (e) {
                console.log('Enrollment check completed');
            }

            // 6. Access course progress (if enrolled)
            console.log('\n📍 Step 6: Access course progress');
            try {
                await this.page.goto('http://localhost:3000/course-progress/test-course', { waitUntil: 'networkidle0' });
                await this.wait(3000);
            } catch (e) {
                console.log('Course progress not accessible');
            }

            // 7. Visit profile
            console.log('\n📍 Step 7: Visit user profile');
            try {
                await this.page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
                await this.wait(2000);
            } catch (e) {
                console.log('Profile access failed');
            }

            // 8. Visit dashboard (if instructor)
            console.log('\n📍 Step 8: Check instructor dashboard');
            try {
                await this.page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
                await this.wait(3000);
            } catch (e) {
                console.log('Dashboard not accessible (likely not instructor)');
            }

            // 9. Wait for health checks to accumulate
            console.log('\n📍 Step 9: Monitor health check polling (30 seconds)');
            await this.wait(35000); // Wait for at least one health check cycle

            console.log('\n✅ User session simulation completed');

        } catch (error) {
            console.error('❌ Session simulation failed:', error);
        }
    }

    generateReport() {
        const totalRequests = this.requests.length;
        const totalResponses = this.responses.length;
        
        // Group by endpoint
        const endpointStats = {};
        this.requests.forEach(req => {
            const endpoint = this.normalizeEndpoint(req.url);
            if (!endpointStats[endpoint]) {
                endpointStats[endpoint] = { count: 0, methods: new Set(), urls: [] };
            }
            endpointStats[endpoint].count++;
            endpointStats[endpoint].methods.add(req.method);
            endpointStats[endpoint].urls.push(req.url);
        });

        // Calculate sizes
        let totalBytes = 0;
        this.responses.forEach(resp => {
            totalBytes += parseInt(resp.size) || 0;
        });

        // Find top endpoints
        const topEndpoints = Object.entries(endpointStats)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 10);

        return {
            summary: {
                timestamp: new Date().toISOString(),
                sessionDurationMs: Date.now() - this.startTime,
                totalRequests,
                totalResponses,
                totalBytes,
                uniqueEndpoints: Object.keys(endpointStats).length
            },
            requests: this.requests,
            responses: this.responses,
            endpointStats,
            topEndpoints: topEndpoints.map(([endpoint, stats]) => ({
                endpoint,
                count: stats.count,
                methods: Array.from(stats.methods),
                exampleUrls: stats.urls.slice(0, 3)
            })),
            costAnalysis: {
                healthChecks: this.requests.filter(r => r.url.includes('/health')).length,
                userDataCalls: this.requests.filter(r => r.url.includes('/api/me')).length,
                courseDetailCalls: this.requests.filter(r => r.url.includes('/course/')).length,
                lectureCalls: this.requests.filter(r => r.url.includes('/lecture')).length,
                estimatedDailyCalls: totalRequests * 24 // Rough estimate for 24-hour extrapolation
            }
        };
    }

    normalizeEndpoint(url) {
        // Normalize URLs to group similar endpoints
        return url
            .replace(/\/[a-f0-9-]{36}/g, '/{id}')  // UUIDs
            .replace(/\/[0-9]+/g, '/{id}')         // Numeric IDs
            .replace(/\?.*$/, '')                  // Remove query params
            .replace(/^https?:\/\/[^\/]+/, '');    // Remove protocol and domain
    }

    async saveResults() {
        const report = this.generateReport();
        
        const outputPath = path.join(__dirname, '../diagnostics/network-log-before.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 BASELINE MEASUREMENT RESULTS:');
        console.log(`📁 Saved to: ${outputPath}`);
        console.log(`🔢 Total API calls: ${report.summary.totalRequests}`);
        console.log(`📦 Total bytes: ${report.summary.totalBytes}`);
        console.log(`⏱️  Session duration: ${Math.round(report.summary.sessionDurationMs / 1000)}s`);
        console.log('\n📈 Top endpoints by frequency:');
        report.topEndpoints.forEach((ep, i) => {
            console.log(`  ${i + 1}. ${ep.endpoint} (${ep.count} calls)`);
        });
        
        console.log('\n💰 Cost analysis:');
        console.log(`  Health checks: ${report.costAnalysis.healthChecks}`);
        console.log(`  User data calls: ${report.costAnalysis.userDataCalls}`);
        console.log(`  Course calls: ${report.costAnalysis.courseDetailCalls}`);
        console.log(`  Lecture calls: ${report.costAnalysis.lectureCalls}`);
        console.log(`  Estimated daily calls: ${report.costAnalysis.estimatedDailyCalls}`);

        // Also save top endpoints summary
        const topEndpointsPath = path.join(__dirname, '../diagnostics/top-endpoints-before.json');
        fs.writeFileSync(topEndpointsPath, JSON.stringify({
            timestamp: report.summary.timestamp,
            topEndpoints: report.topEndpoints,
            costAnalysis: report.costAnalysis
        }, null, 2));
        
        console.log(`📊 Top endpoints saved to: ${topEndpointsPath}`);
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function main() {
    const capture = new NetworkCapture();
    
    try {
        await capture.init();
        await capture.simulateTypicalUserSession();
        await capture.saveResults();
    } catch (error) {
        console.error('❌ Capture failed:', error);
    } finally {
        await capture.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = NetworkCapture;
