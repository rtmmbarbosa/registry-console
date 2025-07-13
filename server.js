const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import authentication middleware
const { requireAuth, redirectIfAuthenticated, handleLogin, handleLogout, getCurrentUser } = require('./middleware/auth');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevent XSS attacks
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(cors());
app.use(express.json());

// Registry configuration
const REGISTRY_CONFIG = {
    url: process.env.REGISTRY_URL,
    username: process.env.REGISTRY_USERNAME,
    password: process.env.REGISTRY_PASSWORD
};

// Application settings configuration
const APP_SETTINGS = {
    defaultTheme: process.env.DEFAULT_THEME || 'light',
    autoRefreshInterval: parseInt(process.env.AUTO_REFRESH_INTERVAL) || 300000,
    autoRefreshEnabled: process.env.AUTO_REFRESH_ENABLED === 'true',
    notificationsEnabled: process.env.NOTIFICATIONS_ENABLED === 'true',
    cacheEnabled: process.env.CACHE_ENABLED === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL) || 300000,
    statisticsExportEnabled: process.env.STATISTICS_EXPORT_ENABLED === 'true',
    settingsExportEnabled: process.env.SETTINGS_EXPORT_ENABLED === 'true'
};

// Authentication configuration
const AUTH_CONFIG = {
    enabled: process.env.AUTH_ENABLED === 'true',
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD,
    sessionSecret: process.env.SESSION_SECRET
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

console.log('⚙️  Application Settings:');
console.log(`   Default Theme: ${APP_SETTINGS.defaultTheme}`);
console.log(`   Auto-refresh: ${APP_SETTINGS.autoRefreshEnabled ? APP_SETTINGS.autoRefreshInterval + 'ms' : 'disabled'}`);
console.log(`   Cache: ${APP_SETTINGS.cacheEnabled ? 'enabled (' + APP_SETTINGS.cacheTTL + 'ms TTL)' : 'disabled'}`);
console.log(`   Notifications: ${APP_SETTINGS.notificationsEnabled ? 'enabled' : 'disabled'}`);
console.log(`   Export Features: Stats=${APP_SETTINGS.statisticsExportEnabled}, Settings=${APP_SETTINGS.settingsExportEnabled}`);

console.log('🔒 Authentication Configuration:');
console.log(`   Enabled: ${AUTH_CONFIG.enabled ? 'yes' : 'no'}`);
if (AUTH_CONFIG.enabled) {
    console.log(`   Username: ${AUTH_CONFIG.username || 'NOT CONFIGURED'}`);
    console.log(`   Password: ${AUTH_CONFIG.password ? '***' : 'NOT CONFIGURED'}`);
    console.log(`   Session Secret: ${AUTH_CONFIG.sessionSecret ? '***' : 'NOT CONFIGURED'}`);
    
    if (!AUTH_CONFIG.username || !AUTH_CONFIG.password || !AUTH_CONFIG.sessionSecret) {
        console.error('❌ Error: Authentication is enabled but credentials are not properly configured');
        process.exit(1);
    }
}
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

// ------- AUTHENTICATION ROUTES -------

// Login page
app.get('/login', redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Authentication API routes
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/logout', handleLogout);
app.get('/api/auth/user', getCurrentUser);

// Static files (excluding index.html which needs authentication)
app.use(express.static('public', { index: false }));

// ------- PROTECTED API ROUTES -------

// Route to list repositories
app.get('/api/repositories', requireAuth, async (req, res) => {
    try {
        const data = await registryRequest('/_catalog');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to list tags from a repository
app.get('/api/repositories/:name/tags', requireAuth, async (req, res) => {
    try {
        const { name } = req.params;
        const data = await registryRequest(`/${name}/tags/list`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get image manifest
app.get('/api/repositories/:name/manifests/:tag', requireAuth, async (req, res) => {
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
app.delete('/api/repositories/:name/manifests/:digest', requireAuth, async (req, res) => {
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
    ttl: APP_SETTINGS.cacheTTL
};

// Route to get statistics
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        // Check cache first (if enabled)
        const now = Date.now();
        if (APP_SETTINGS.cacheEnabled && statsCache.data && (now - statsCache.timestamp) < statsCache.ttl) {
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

        // Cache the results (if enabled)
        if (APP_SETTINGS.cacheEnabled) {
            statsCache.data = statsData;
            statsCache.timestamp = now;
            console.log(`📊 Statistics calculated and cached in ${statsData.metadata.processingTime}ms`);
        } else {
            console.log(`📊 Statistics calculated in ${statsData.metadata.processingTime}ms (cache disabled)`);
        }
        
        res.json(statsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to invalidate statistics cache
app.post('/api/stats/refresh', requireAuth, async (req, res) => {
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
app.get('/api/repositories/:name/blobs/:digest', requireAuth, async (req, res) => {
    try {
        const { name, digest } = req.params;
        const data = await registryRequest(`/${name}/blobs/${digest}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get registry configuration
app.get('/api/config', requireAuth, async (req, res) => {
    try {
        res.json({
            registryUrl: REGISTRY_CONFIG.url
        });
    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to get application settings
app.get('/api/settings', requireAuth, async (req, res) => {
    try {
        res.json({
            defaultTheme: APP_SETTINGS.defaultTheme,
            autoRefreshInterval: APP_SETTINGS.autoRefreshInterval,
            autoRefreshEnabled: APP_SETTINGS.autoRefreshEnabled,
            notificationsEnabled: APP_SETTINGS.notificationsEnabled,
            cacheEnabled: APP_SETTINGS.cacheEnabled,
            cacheTTL: APP_SETTINGS.cacheTTL,
            statisticsExportEnabled: APP_SETTINGS.statisticsExportEnabled,
            settingsExportEnabled: APP_SETTINGS.settingsExportEnabled,
            registryUrl: REGISTRY_CONFIG.url
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to update application settings (for live updates)
app.post('/api/settings', requireAuth, async (req, res) => {
    try {
        const {
            defaultTheme,
            autoRefreshInterval,
            autoRefreshEnabled,
            notificationsEnabled,
            cacheEnabled,
            cacheTTL
        } = req.body;

        // Validate inputs
        const validThemes = ['light', 'dark', 'auto'];
        if (defaultTheme && !validThemes.includes(defaultTheme)) {
            return res.status(400).json({ error: 'Invalid theme value' });
        }

        if (autoRefreshInterval && (autoRefreshInterval < 0 || autoRefreshInterval > 3600000)) {
            return res.status(400).json({ error: 'Invalid refresh interval (must be 0-3600000ms)' });
        }

        if (cacheTTL && (cacheTTL < 60000 || cacheTTL > 3600000)) {
            return res.status(400).json({ error: 'Invalid cache TTL (must be 60000-3600000ms)' });
        }

        // Update in-memory settings
        if (defaultTheme !== undefined) APP_SETTINGS.defaultTheme = defaultTheme;
        if (autoRefreshInterval !== undefined) APP_SETTINGS.autoRefreshInterval = autoRefreshInterval;
        if (autoRefreshEnabled !== undefined) APP_SETTINGS.autoRefreshEnabled = autoRefreshEnabled;
        if (notificationsEnabled !== undefined) APP_SETTINGS.notificationsEnabled = notificationsEnabled;
        if (cacheEnabled !== undefined) APP_SETTINGS.cacheEnabled = cacheEnabled;
        if (cacheTTL !== undefined) {
            APP_SETTINGS.cacheTTL = cacheTTL;
            statsCache.ttl = cacheTTL; // Update cache TTL immediately
        }

        // Note: In a production environment, you might want to:
        // 1. Write these changes to a persistent configuration file
        // 2. Update environment variables dynamically
        // 3. Restart services if needed

        console.log('⚙️  Settings updated:', req.body);

        res.json({
            success: true,
            message: 'Settings updated successfully',
            currentSettings: {
                defaultTheme: APP_SETTINGS.defaultTheme,
                autoRefreshInterval: APP_SETTINGS.autoRefreshInterval,
                autoRefreshEnabled: APP_SETTINGS.autoRefreshEnabled,
                notificationsEnabled: APP_SETTINGS.notificationsEnabled,
                cacheEnabled: APP_SETTINGS.cacheEnabled,
                cacheTTL: APP_SETTINGS.cacheTTL,
                statisticsExportEnabled: APP_SETTINGS.statisticsExportEnabled,
                settingsExportEnabled: APP_SETTINGS.settingsExportEnabled
            }
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to reset settings to defaults
app.post('/api/settings/reset', requireAuth, async (req, res) => {
    try {
        // Reset to environment defaults
        APP_SETTINGS.defaultTheme = process.env.DEFAULT_THEME || 'light';
        APP_SETTINGS.autoRefreshInterval = parseInt(process.env.AUTO_REFRESH_INTERVAL) || 300000;
        APP_SETTINGS.autoRefreshEnabled = process.env.AUTO_REFRESH_ENABLED === 'true';
        APP_SETTINGS.notificationsEnabled = process.env.NOTIFICATIONS_ENABLED === 'true';
        APP_SETTINGS.cacheEnabled = process.env.CACHE_ENABLED === 'true';
        APP_SETTINGS.cacheTTL = parseInt(process.env.CACHE_TTL) || 300000;
        APP_SETTINGS.statisticsExportEnabled = process.env.STATISTICS_EXPORT_ENABLED === 'true';
        APP_SETTINGS.settingsExportEnabled = process.env.SETTINGS_EXPORT_ENABLED === 'true';

        // Update cache TTL
        statsCache.ttl = APP_SETTINGS.cacheTTL;

        console.log('⚙️  Settings reset to defaults');

        res.json({
            success: true,
            message: 'Settings reset to defaults successfully',
            currentSettings: {
                defaultTheme: APP_SETTINGS.defaultTheme,
                autoRefreshInterval: APP_SETTINGS.autoRefreshInterval,
                autoRefreshEnabled: APP_SETTINGS.autoRefreshEnabled,
                notificationsEnabled: APP_SETTINGS.notificationsEnabled,
                cacheEnabled: APP_SETTINGS.cacheEnabled,
                cacheTTL: APP_SETTINGS.cacheTTL,
                statisticsExportEnabled: APP_SETTINGS.statisticsExportEnabled,
                settingsExportEnabled: APP_SETTINGS.settingsExportEnabled
            }
        });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend application
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Registry UI running at http://localhost:${PORT}`);
    console.log(`📋 Registry configured: ${REGISTRY_CONFIG.url}`);
});
