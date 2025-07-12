const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Registry configuration
const REGISTRY_CONFIG = {
    url: process.env.REGISTRY_URL,
    username: process.env.REGISTRY_USERNAME,
    password: process.env.REGISTRY_PASSWORD
};

// Check if credentials are configured
if (!REGISTRY_CONFIG.url || !REGISTRY_CONFIG.username || !REGISTRY_CONFIG.password) {
    console.error('❌ Error: Registry credentials not configured in .env');
    process.exit(1);
}

console.log('🔐 Registry Configuration:');
console.log(`   URL: ${REGISTRY_CONFIG.url}`);
console.log(`   Username: ${REGISTRY_CONFIG.username}`);
console.log(`   Password: ${REGISTRY_CONFIG.password ? '***' : 'NOT CONFIGURED'}`);

// Basic authentication function
function getAuthHeader() {
    const credentials = Buffer.from(`${REGISTRY_CONFIG.username}:${REGISTRY_CONFIG.password}`).toString('base64');
    return `Basic ${credentials}`;
}

// Get authentication token
async function getAuthToken() {
    const { default: fetch } = await import('node-fetch');
    
    try {
        // First, try to get the token
        const authUrl = `https://${REGISTRY_CONFIG.url}/v2/`;
        const authResponse = await fetch(authUrl, {
            headers: {
                'Authorization': getAuthHeader()
            }
        });

        if (authResponse.status === 401) {
            const authHeader = authResponse.headers.get('www-authenticate');
            if (authHeader && authHeader.includes('Bearer')) {
                // Extract token information
                const realmMatch = authHeader.match(/realm="([^"]+)"/);
                const serviceMatch = authHeader.match(/service="([^"]+)"/);
                
                if (realmMatch && serviceMatch) {
                    const tokenUrl = `${realmMatch[1]}?service=${serviceMatch[1]}`;
                    const tokenResponse = await fetch(tokenUrl, {
                        headers: {
                            'Authorization': getAuthHeader()
                        }
                    });
                    
                    if (tokenResponse.ok) {
                        const tokenData = await tokenResponse.json();
                        return tokenData.token;
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.warn('Error getting token:', error.message);
        return null;
    }
}

// Make requests to registry
async function registryRequest(endpoint, options = {}) {
    const { default: fetch } = await import('node-fetch');
    
    const url = `https://${REGISTRY_CONFIG.url}/v2${endpoint}`;
    
    // Try first with Basic Auth
    let headers = {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        ...options.headers
    };

    try {
        let response = await fetch(url, {
            ...options,
            headers
        });

        // If 401, try with token
        if (response.status === 401) {
            const token = await getAuthToken();
            if (token) {
                headers = {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    ...options.headers
                };
                
                response = await fetch(url, {
                    ...options,
                    headers
                });
            }
        }

        if (!response.ok) {
            throw new Error(`Registry API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Registry request failed:', error);
        throw error;
    }
}

// Route to list repositories
app.get('/api/repositories', async (req, res) => {
    try {
        const data = await registryRequest('/_catalog');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to list tags from a repository
app.get('/api/repositories/:name/tags', async (req, res) => {
    try {
        const { name } = req.params;
        const data = await registryRequest(`/${name}/tags/list`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get image manifest
app.get('/api/repositories/:name/manifests/:tag', async (req, res) => {
    try {
        const { name, tag } = req.params;
        
        // Get the manifest first
        const manifest = await registryRequest(`/${name}/manifests/${tag}`, {
            headers: {
                'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
            }
        });
        
        // If manifest has config, get the config blob for additional info
        if (manifest.config && manifest.config.digest) {
            try {
                const configData = await registryRequest(`/${name}/blobs/${manifest.config.digest}`);
                
                // Merge config data into manifest response
                manifest.config = {
                    ...manifest.config,
                    created: configData.created,
                    architecture: configData.architecture,
                    os: configData.os,
                    author: configData.author,
                    config: configData.config
                };
            } catch (configError) {
                console.log(`⚠️ Could not fetch config for ${name}:${tag}:`, configError.message);
                // Continue with basic manifest data
            }
        }
        
        // Add registry URL for docker pull command
        manifest.registryUrl = REGISTRY_CONFIG.url;
        
        res.json(manifest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to delete an image
app.delete('/api/repositories/:name/manifests/:digest', async (req, res) => {
    try {
        const { name, digest } = req.params;
        const { default: fetch } = await import('node-fetch');
        
        const url = `https://${REGISTRY_CONFIG.url}/v2/${name}/manifests/${digest}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': getAuthHeader()
            }
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
        }

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cache for statistics to improve performance
let statsCache = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes TTL
};

// Route to get statistics
app.get('/api/stats', async (req, res) => {
    try {
        // Check cache first
        const now = Date.now();
        if (statsCache.data && (now - statsCache.timestamp) < statsCache.ttl) {
            console.log('📊 Returning cached statistics');
            return res.json(statsCache.data);
        }
        
        console.log('📊 Calculating fresh statistics...');
        
        // Get repository list
        const reposData = await registryRequest('/_catalog');
        const repositories = reposData.repositories || [];
        
        let totalImages = 0;
        let totalSize = 0;
        let totalLayers = 0;
        const repoStats = [];
        const tagStats = { latest: 0, versioned: 0, other: 0 };
        const sizeDistribution = { small: 0, medium: 0, large: 0, xlarge: 0 };
        const activityStats = { recentRepos: 0, activeRepos: 0 };

        for (const repo of repositories) {
            try {
                const tagsData = await registryRequest(`/${repo}/tags/list`);
                const tags = tagsData.tags || [];
                
                if (tags.length === 0) continue;
                
                totalImages += tags.length;
                
                // Analyze tag patterns
                tags.forEach(tag => {
                    if (tag === 'latest') {
                        tagStats.latest++;
                    } else if (/^\d+\./.test(tag)) { // Semantic versioning
                        tagStats.versioned++;
                    } else {
                        tagStats.other++;
                    }
                });
                
                // For each tag, get the manifest to calculate size
                let repoSize = 0;
                let repoLayers = 0;
                let hasRecentActivity = false;
                
                for (const tag of tags) {
                    try {
                        const manifest = await registryRequest(`/${repo}/manifests/${tag}`, {
                            headers: {
                                'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
                            }
                        });
                        
                        // Calculate size and layers based on manifest
                        if (manifest.config && manifest.config.size) {
                            repoSize += manifest.config.size;
                        }
                        if (manifest.layers) {
                            repoLayers += manifest.layers.length;
                            manifest.layers.forEach(layer => {
                                if (layer.size) {
                                    repoSize += layer.size;
                                }
                            });
                        }
                        
                        // Check for recent activity (simplified - you might want to get actual timestamps)
                        if (tag === 'latest' || /^(main|master|dev)$/.test(tag)) {
                            hasRecentActivity = true;
                        }
                        
                    } catch (err) {
                        console.warn(`Error getting manifest for ${repo}:${tag}`, err.message);
                    }
                }
                
                // Categorize repository by size
                const repoSizeMB = repoSize / (1024 * 1024);
                if (repoSizeMB < 50) {
                    sizeDistribution.small++;
                } else if (repoSizeMB < 200) {
                    sizeDistribution.medium++;
                } else if (repoSizeMB < 1000) {
                    sizeDistribution.large++;
                } else {
                    sizeDistribution.xlarge++;
                }
                
                if (hasRecentActivity) {
                    activityStats.recentRepos++;
                }
                if (tags.length > 1) {
                    activityStats.activeRepos++;
                }
                
                repoStats.push({
                    name: repo,
                    tags: tags.length,
                    size: repoSize,
                    layers: repoLayers
                });
                
                totalSize += repoSize;
                totalLayers += repoLayers;
                
            } catch (err) {
                console.warn(`Error processing repository ${repo}`, err.message);
            }
        }
        
        // Calculate averages
        const avgImagesPerRepo = repositories.length > 0 ? Math.round(totalImages / repositories.length * 10) / 10 : 0;
        const avgSizePerRepo = repositories.length > 0 ? totalSize / repositories.length : 0;
        const avgLayersPerImage = totalImages > 0 ? Math.round(totalLayers / totalImages * 10) / 10 : 0;

        // Sort repositories by size to get the largest
        const sortedRepos = repoStats.sort((a, b) => b.size - a.size);
        const largestRepo = sortedRepos.length > 0 ? sortedRepos[0] : null;

        const statsData = {
            basic: {
                totalRepositories: repositories.length,
                totalImages,
                totalSize,
                totalLayers
            },
            averages: {
                avgImagesPerRepo,
                avgSizePerRepo,
                avgLayersPerImage
            },
            distribution: {
                tags: tagStats,
                sizes: sizeDistribution,
                activity: activityStats
            },
            repositories: sortedRepos,
            health: {
                emptyRepos: repositories.length - repoStats.length,
                activeRepos: activityStats.activeRepos,
                inactiveRepos: repositories.length - activityStats.activeRepos
            },
            insights: {
                largestRepo: largestRepo,
                recentRepos: activityStats.recentRepos
            },
            metadata: {
                lastUpdated: new Date().toISOString(),
                processingTime: Date.now() - now
            }
        };

        // Cache the results
        statsCache.data = statsData;
        statsCache.timestamp = now;
        
        console.log(`📊 Statistics calculated in ${statsData.metadata.processingTime}ms`);
        res.json(statsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to invalidate statistics cache
app.post('/api/stats/refresh', async (req, res) => {
    try {
        console.log('🔄 Invalidating statistics cache...');
        
        // Clear cache
        statsCache.data = null;
        statsCache.timestamp = 0;
        
        res.json({
            success: true,
            message: 'Statistics cache cleared - next request will fetch fresh data'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get blob data (config information)
app.get('/api/repositories/:name/blobs/:digest', async (req, res) => {
    try {
        const { name, digest } = req.params;
        const data = await registryRequest(`/${name}/blobs/${digest}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get registry configuration
app.get('/api/config', async (req, res) => {
    try {
        res.json({
            registryUrl: REGISTRY_CONFIG.url
        });
    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Registry UI running at http://localhost:${PORT}`);
    console.log(`📋 Registry configured: ${REGISTRY_CONFIG.url}`);
});
