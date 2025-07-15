const http = require('http');
const { spawn } = require('child_process');

// Simple smoke test to verify app starts and responds
async function smokeTest() {
    console.log('🧪 Starting smoke test...');
    
    // Start the server
    const server = spawn('node', ['server.js'], {
        env: {
            ...process.env,
            PORT: '3001',
            NODE_ENV: 'test',
            AUTH_ENABLED: 'false',
            REGISTRY_URL: 'registry.example.com',
            REGISTRY_USERNAME: 'test',
            REGISTRY_PASSWORD: 'test'
        }
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // Test health endpoint
        const healthResponse = await makeRequest('http://localhost:3001/health');
        if (healthResponse.status !== 'healthy') {
            throw new Error('Health check failed');
        }
        console.log('✅ Health check passed');
        
        // Test basic routes
        const homeResponse = await makeRequest('http://localhost:3001/');
        if (!homeResponse.includes('RegistryConsole')) {
            throw new Error('Home page not loading correctly');
        }
        console.log('✅ Home page loads correctly');
        
        console.log('🎉 All smoke tests passed!');
        
    } catch (error) {
        console.error('❌ Smoke test failed:', error.message);
        process.exit(1);
    } finally {
        server.kill();
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
}

if (require.main === module) {
    smokeTest();
}

module.exports = { smokeTest };
