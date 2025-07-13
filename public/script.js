// Global application state
let currentView = 'home';
let currentPage = 'home';
let repositories = [];
let statistics = {};
let deleteImageData = null;
let selectedItem = null;
let registryConfig = null;

// Authentication state
let authState = {
    authenticated: false,
    authEnabled: false,
    username: null,
    loginTime: null
};

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        
        authState = {
            authenticated: data.authenticated || false,
            authEnabled: data.authEnabled || false,
            username: data.username || null,
            loginTime: data.loginTime || null
        };
        
        // Update UI based on auth state
        updateAuthUI();
        
        return authState;
    } catch (error) {
        console.error('Error checking auth status:', error);
        authState = {
            authenticated: false,
            authEnabled: false,
            username: null,
            loginTime: null
        };
        return authState;
    }
}

// Update UI based on authentication state
function updateAuthUI() {
    if (!authState.authEnabled) {
        // Authentication disabled - hide auth elements
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(el => el.style.display = 'none');
        return;
    }
    
    // Authentication enabled - show/hide elements based on login state
    const loggedInElements = document.querySelectorAll('[data-auth="logged-in"]');
    const loggedOutElements = document.querySelectorAll('[data-auth="logged-out"]');
    
    if (authState.authenticated) {
        loggedInElements.forEach(el => el.style.display = '');
        loggedOutElements.forEach(el => el.style.display = 'none');
        
        // Update username display
        const usernameElements = document.querySelectorAll('[data-username]');
        usernameElements.forEach(el => el.textContent = authState.username || 'User');
    } else {
        loggedInElements.forEach(el => el.style.display = 'none');
        loggedOutElements.forEach(el => el.style.display = '');
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Check if response is ok
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                // Clear any cached data
                localStorage.removeItem('authUser');
                sessionStorage.clear();
                
                // Redirect to login page
                window.location.href = data.redirectTo || '/login';
            } else {
                showToast('Logout failed', 'error');
            }
        } else {
            // If not JSON response, assume redirect
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect to login on error
        window.location.href = '/login';
    }
}

// Enhanced fetch with authentication error handling
async function authenticatedFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            // Unauthorized - redirect to login
            const data = await response.json();
            if (data.redirectTo) {
                window.location.href = data.redirectTo;
            } else {
                window.location.href = '/login';
            }
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
}

// DOM elements - Initialize after DOM is loaded
let elements = {};

function initializeElements() {
    elements = {
        repositoriesList: document.getElementById('repositoriesList'),
        loadingRepos: document.getElementById('loadingRepos'),
        loadingStats: document.getElementById('loadingStats'),
        deleteModal: document.getElementById('deleteModal'),
        confirmDelete: document.getElementById('confirmDelete'),
        cancelDelete: document.getElementById('cancelDelete'),
        deleteRepoName: document.getElementById('deleteRepoName'),
        deleteTagName: document.getElementById('deleteTagName'),
        toast: document.getElementById('toast'),
        detailsPanel: document.getElementById('detailsPanel'),
        navItems: document.querySelectorAll('.nav-item'),
        pages: document.querySelectorAll('.page')
    };
    
    // Debug log missing elements
    Object.keys(elements).forEach(key => {
        if (!elements[key] || (elements[key].length !== undefined && elements[key].length === 0)) {
            console.warn(`⚠️ Element not found: ${key}`);
        } else {
            console.log(`✅ Found element: ${key}`);
        }
    });
    
    console.log('📋 Elements initialized:', Object.keys(elements).length);
}

// Navigation System
function switchPage(pageId) {
    currentPage = pageId;
    
    // Hide all pages
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation buttons
    elements.navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Load page-specific data
    loadPageData(pageId);
}

function loadPageData(pageId) {
    switch (pageId) {
        case 'home':
            if (repositories.length === 0) {
                loadRepositories();
            }
            loadStatistics();
            break;
        case 'analytics':
            loadStatistics();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Setup navigation event listeners
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            if (pageId) {
                switchPage(pageId);
            }
        });
    });
}

// Event Listeners
function setupEventListeners() {
    if (elements.confirmDelete) {
        elements.confirmDelete.addEventListener('click', confirmDeleteImage);
    }
    if (elements.cancelDelete) {
        elements.cancelDelete.addEventListener('click', closeDeleteModal);
    }
    if (elements.deleteModal) {
        elements.deleteModal.addEventListener('click', (e) => {
            if (e.target === elements.deleteModal) {
                closeDeleteModal();
            }
        });
    }
    
    // Add theme toggle button event listeners
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
}

// Load repositories
async function loadRepositories() {
    showLoading('repos');
    elements.repositoriesList.innerHTML = '';
    
    try {
        const response = await authenticatedFetch('/api/repositories');
        if (!response) return; // Authentication failed and redirected
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error loading repositories');
        }
        
        repositories = data.repositories || [];
        
        if (repositories.length === 0) {
            elements.repositoriesList.innerHTML = `
                <div class="empty-state">
                    <h3>No repositories found</h3>
                    <p>No repositories were found in the registry.</p>
                </div>
            `;
        } else {
            await loadRepositoriesWithTags();
        }
    } catch (error) {
        showError('Error loading repositories: ' + error.message);
        elements.repositoriesList.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
    } finally {
        hideLoading('repos');
    }
}

// Load repositories with tags
async function loadRepositoriesWithTags() {
    const repoItems = [];
    
    for (const repo of repositories) {
        try {
            const response = await authenticatedFetch(`/api/repositories/${encodeURIComponent(repo)}/tags`);
            if (!response) return; // Authentication failed and redirected
            const data = await response.json();
            
            if (response.ok) {
                const tags = data.tags || [];
                repoItems.push(createRepositoryItem(repo, tags));
            } else {
                repoItems.push(createRepositoryItem(repo, [], data.error));
            }
        } catch (error) {
            repoItems.push(createRepositoryItem(repo, [], error.message));
        }
    }
    
    elements.repositoriesList.innerHTML = repoItems.join('');
    attachRepositoryEventListeners();
}

// Create repository item
function createRepositoryItem(repoName, tags, error = null) {
    const tagsHtml = error ? 
        `<div class="error-message">Error: ${error}</div>` :
        tags.length === 0 ? 
            '<div class="empty-state"><p>No tags found</p></div>' :
            tags.map(tag => `
                <div class="tag-item" data-repo="${repoName}" data-tag="${tag}">
                    <span class="tag-name">${tag}</span>
                    <div class="tag-actions">
                        <button class="btn btn-danger" onclick="showDeleteModal('${repoName}', '${tag}')">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
    
    return `
        <div class="repository-item" data-repo="${repoName}">
            <div class="repository-header">
                <h3 class="repository-name">${repoName}</h3>
                <span class="repository-count">${tags.length} tags</span>
            </div>
            <div class="repository-tags">
                ${tagsHtml}
            </div>
        </div>
    `;
}

// Attach event listeners to repository items
function attachRepositoryEventListeners() {
    // Repository headers - toggle expand/collapse
    document.querySelectorAll('.repository-header').forEach(header => {
        header.addEventListener('click', function(e) {
            const repoItem = this.closest('.repository-item');
            const tags = repoItem.querySelector('.repository-tags');
            const isExpanded = tags.classList.contains('show');
            
            // Close all other repositories
            document.querySelectorAll('.repository-tags').forEach(tagContainer => {
                tagContainer.classList.remove('show');
            });
            document.querySelectorAll('.repository-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Toggle current repository
            if (!isExpanded) {
                tags.classList.add('show');
                repoItem.classList.add('selected');
            }
        });
    });
    
    // Tag items - show details
    document.querySelectorAll('.tag-item').forEach(tagItem => {
        tagItem.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn')) return;
            
            const repo = this.dataset.repo;
            const tag = this.dataset.tag;
            
            // Update selection
            document.querySelectorAll('.tag-item').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Show details
            showImageDetails(repo, tag);
        });
    });
}

// Load statistics
async function loadStatistics() {
    showLoading('stats');
    
    try {
        const response = await authenticatedFetch('/api/stats');
        if (!response) return; // Authentication failed and redirected
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error loading statistics');
        }
        
        statistics = data;
        displayStatistics();
    } catch (error) {
        showError('Error loading statistics: ' + error.message);
    } finally {
        hideLoading('stats');
    }
}

// Display statistics
function displayStatistics() {
    // Statistics display removed from sidebar
    // Only update analytics page if needed
    updateAnalyticsPage();
}

// Update analytics page elements
function updateAnalyticsPage() {
    const analyticsElements = {
        analyticsRepos: document.getElementById('analyticsRepos'),
        analyticsImages: document.getElementById('analyticsImages'),
        analyticsSize: document.getElementById('analyticsSize'),
        analyticsLargest: document.getElementById('analyticsLargest'),
        avgImagesPerRepo: document.getElementById('avgImagesPerRepo'),
        avgSizePerRepo: document.getElementById('avgSizePerRepo'),
        avgLayers: document.getElementById('avgLayers'),
        activeRepos: document.getElementById('activeRepos'),
        emptyRepos: document.getElementById('emptyRepos'),
        latestTags: document.getElementById('latestTags')
    };
    
    if (analyticsElements.analyticsRepos) {
        analyticsElements.analyticsRepos.textContent = statistics.basic?.totalRepositories || 0;
    }
    if (analyticsElements.analyticsImages) {
        analyticsElements.analyticsImages.textContent = statistics.basic?.totalImages || 0;
    }
    if (analyticsElements.analyticsSize) {
        analyticsElements.analyticsSize.textContent = formatBytes(statistics.basic?.totalSize || 0);
    }
    if (analyticsElements.analyticsLargest) {
        const largestRepo = statistics.insights?.largestRepo;
        if (largestRepo) {
            analyticsElements.analyticsLargest.textContent = `${largestRepo.name} (${formatBytes(largestRepo.size)})`;
            // Add class for proper text wrapping on long repository names
            analyticsElements.analyticsLargest.classList.add('largest-repo');
        } else {
            analyticsElements.analyticsLargest.textContent = 'No data';
            analyticsElements.analyticsLargest.classList.remove('largest-repo');
        }
    }
    
    // Update advanced metrics
    if (analyticsElements.avgImagesPerRepo) {
        analyticsElements.avgImagesPerRepo.textContent = statistics.averages?.avgImagesPerRepo?.toFixed(1) || '0';
    }
    if (analyticsElements.avgSizePerRepo) {
        analyticsElements.avgSizePerRepo.textContent = formatBytes(statistics.averages?.avgSizePerRepo || 0);
    }
    if (analyticsElements.avgLayers) {
        analyticsElements.avgLayers.textContent = statistics.averages?.avgLayersPerImage?.toFixed(1) || '0';
    }
    if (analyticsElements.activeRepos) {
        analyticsElements.activeRepos.textContent = statistics.health?.activeRepos || 0;
    }
    if (analyticsElements.emptyRepos) {
        analyticsElements.emptyRepos.textContent = statistics.health?.emptyRepos || 0;
    }
    if (analyticsElements.latestTags) {
        analyticsElements.latestTags.textContent = statistics.distribution?.tags?.latest || 0;
    }
    
    // Update Top Consumers section
    updateTopConsumers();
    
    // Update Size Distribution Chart
    updateSizeDistributionChart();
}

// Update Top Consumers section
function updateTopConsumers() {
    const topConsumersContainer = document.getElementById('topConsumers');
    if (!topConsumersContainer) return;
    
    const repositories = statistics.repositories || [];
    
    if (repositories.length === 0) {
        topConsumersContainer.innerHTML = `
            <div class="loading-chart">No repository data available</div>
        `;
        return;
    }
    
    // Sort by size and take top 3
    const topRepos = repositories
        .sort((a, b) => b.size - a.size)
        .slice(0, 3);
    
    // Calculate total size for percentage calculation
    const totalSize = repositories.reduce((sum, repo) => sum + repo.size, 0);
    
    topConsumersContainer.innerHTML = topRepos.map((repo, index) => {
        const percentage = totalSize > 0 ? (repo.size / totalSize * 100).toFixed(1) : 0;
        return `
            <div class="repo-item clickable" data-repo="${repo.name}" onclick="navigateToRepository('${repo.name}')">
                <div class="repo-rank">#${index + 1}</div>
                <div class="repo-info">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-stats">
                        <span>${repo.tags} tags</span>
                        <span>${repo.layers} layers</span>
                    </div>
                    <div class="repo-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="progress-text">${percentage}% of total</div>
                    </div>
                </div>
                <div class="repo-size">${formatBytes(repo.size)}</div>
            </div>
        `;
    }).join('');
}

// Update Size Distribution Chart as Pie Chart
function updateSizeDistributionChart() {
    const chartContainer = document.getElementById('sizeDistributionChart');
    if (!chartContainer) return;
    
    const sizeDistribution = statistics.distribution?.sizes || {};
    const data = [
        { label: 'Small (<50MB)', value: sizeDistribution.small || 0, color: '#b8956f' },
        { label: 'Medium (50-200MB)', value: sizeDistribution.medium || 0, color: '#9bc07c' },
        { label: 'Large (200MB-1GB)', value: sizeDistribution.large || 0, color: '#d4b882' },
        { label: 'X-Large (>1GB)', value: sizeDistribution.xlarge || 0, color: '#c07c7c' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
        chartContainer.innerHTML = `
            <div class="loading-chart">No size distribution data available</div>
        `;
        return;
    }
    
    // Calculate angles for pie chart
    let currentAngle = 0;
    const chartData = data.map(item => {
        const percentage = (item.value / total) * 100;
        const angle = (item.value / total) * 360;
        const result = {
            ...item,
            percentage: percentage.toFixed(1),
            startAngle: currentAngle,
            endAngle: currentAngle + angle
        };
        currentAngle += angle;
        return result;
    }).filter(item => item.value > 0); // Only show segments with data
    
    // Create pie chart HTML
    const pieChartHTML = `
        <div class="pie-chart-wrapper">
            <div class="pie-chart" style="
                --chart-color-1: ${chartData[0]?.color || '#b8956f'};
                --chart-color-2: ${chartData[1]?.color || '#9bc07c'};
                --chart-color-3: ${chartData[2]?.color || '#d4b882'};
                --chart-color-4: ${chartData[3]?.color || '#c07c7c'};
                --chart-end-1: ${chartData[0]?.endAngle || 0}deg;
                --chart-end-2: ${chartData[1]?.endAngle || 0}deg;
                --chart-end-3: ${chartData[2]?.endAngle || 0}deg;
                background: conic-gradient(
                    from 0deg,
                    ${chartData.map(item => 
                        `${item.color} ${item.startAngle}deg ${item.endAngle}deg`
                    ).join(', ')}
                );
            ">
                <div class="pie-chart-center">
                    ${total}<br>
                    <span style="font-size: 0.7em; opacity: 0.8;">Total</span>
                </div>
            </div>
            <div class="pie-chart-legend">
                ${chartData.map(item => `
                    <div class="pie-legend-item">
                        <div class="pie-legend-color" style="background-color: ${item.color}"></div>
                        <div class="pie-legend-info">
                            <div class="pie-legend-label">${item.label}</div>
                            <div class="pie-legend-stats">
                                <span class="pie-legend-count">${item.value}</span>
                                <span class="pie-legend-percentage">${item.percentage}%</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    chartContainer.innerHTML = pieChartHTML;
}

// Show delete modal
function showDeleteModal(repoName, tagName) {
    deleteImageData = { repo: repoName, tag: tagName };
    elements.deleteRepoName.textContent = repoName;
    elements.deleteTagName.textContent = tagName;
    elements.deleteModal.classList.add('show');
}

// Close delete modal
function closeDeleteModal() {
    elements.deleteModal.classList.remove('show');
    deleteImageData = null;
}

// Confirm image deletion
async function confirmDeleteImage() {
    if (!deleteImageData) return;
    
    try {
        const manifestResponse = await fetch(`/api/repositories/${encodeURIComponent(deleteImageData.repo)}/manifests/${encodeURIComponent(deleteImageData.tag)}`, {
            headers: {
                'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
            }
        });
        
        if (!manifestResponse.ok) {
            throw new Error('Error getting image manifest');
        }
        
        const digest = manifestResponse.headers.get('Docker-Content-Digest');
        if (!digest) {
            throw new Error('Digest not found in manifest');
        }
        
        const deleteResponse = await fetch(`/api/repositories/${encodeURIComponent(deleteImageData.repo)}/manifests/${digest}`, {
            method: 'DELETE'
        });
        
        const result = await deleteResponse.json();
        
        if (!deleteResponse.ok) {
            throw new Error(result.error || 'Error deleting image');
        }
        
        showToast('Image deleted successfully!', 'success');
        closeDeleteModal();
        
        setTimeout(() => {
            refreshData();
        }, 1000);
        
    } catch (error) {
        showError('Error deleting image: ' + error.message);
    }
}

// Show image details in right panel
async function showImageDetails(repoName, tagName) {
    selectedItem = { repo: repoName, tag: tagName };
    
    elements.detailsPanel.innerHTML = `
        <div class="details-placeholder">
            <div class="placeholder-icon">⏳</div>
            <h3>Loading details...</h3>
            <p>Please wait while we fetch the image information</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/repositories/${encodeURIComponent(repoName)}/manifests/${encodeURIComponent(tagName)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error getting manifest');
        }
        
        let totalSize = 0;
        if (data.config?.size) {
            totalSize += data.config.size;
        }
        if (data.layers) {
            data.layers.forEach(layer => {
                if (layer.size) {
                    totalSize += layer.size;
                }
            });
        }
        
        const detailsHtml = `
            <div class="details-header">
                <div class="details-title">
                    <h3>${repoName}</h3>
                    <div class="details-subtitle">${tagName}</div>
                </div>
                <div class="details-actions">
                    <button class="btn btn-danger" onclick="showDeleteModal('${repoName}', '${tagName}')">
                        Delete
                    </button>
                    <button class="btn btn-secondary" onclick="closeDetailsPanel()" title="Close">
                        ✕
                    </button>
                </div>
            </div>
            <div class="details-body">
                <div class="info-section">
                    <h4>Image Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Creation Date</div>
                            <div class="info-value">${data.config?.created ? new Date(data.config.created).toLocaleString() : 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Architecture</div>
                            <div class="info-value">${data.config?.architecture ? (data.config.os + '/' + data.config.architecture) : 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Config Size</div>
                            <div class="info-value">${data.config?.size ? formatBytes(data.config.size) : 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Total Size</div>
                            <div class="info-value">${formatBytes(totalSize)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Layers</div>
                            <div class="info-value">${data.layers?.length || 0} total</div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4>Docker Pull Command</h4>
                    <div class="docker-pull-command">
                        <div class="pull-command-container">
                            <code id="pullCommand">docker pull ${data.registryUrl || 'localhost:5000'}/${repoName}:${tagName}</code>
                            <button class="btn btn-copy" onclick="copyToClipboard('pullCommand')" title="Copy to clipboard">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        elements.detailsPanel.innerHTML = detailsHtml;
        
    } catch (error) {
        elements.detailsPanel.innerHTML = `
            <div class="details-placeholder">
                <div class="placeholder-icon">❌</div>
                <h3>Error loading details</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Close details panel
function closeDetailsPanel() {
    elements.detailsPanel.innerHTML = `
        <div class="details-placeholder">
            <div class="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </div>
            <h3>Select an image to view details</h3>
            <p>Click on any repository or tag to see detailed information</p>
        </div>
    `;
    selectedItem = null;
}

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = element.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Docker pull command copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Docker pull command copied to clipboard!', 'success');
        });
    }
}

// Refresh data
function refreshData() {
    if (currentPage === 'home') {
        loadRepositories();
        loadStatistics();
    } else if (currentPage === 'analytics') {
        loadStatistics();
    }
}

// Refresh statistics
async function refreshStatistics() {
    try {
        await fetch('/api/stats/refresh', { method: 'POST' });
        await loadStatistics();
    } catch (error) {
        showError('Error refreshing statistics: ' + error.message);
    }
}

// Utilities
function showLoading(type) {
    if (type === 'repos' && elements.loadingRepos) {
        elements.loadingRepos.classList.add('show');
    } else if (type === 'stats' && elements.loadingStats) {
        elements.loadingStats.classList.add('show');
    }
}

function hideLoading(type) {
    if (type === 'repos' && elements.loadingRepos) {
        elements.loadingRepos.classList.remove('show');
    } else if (type === 'stats' && elements.loadingStats) {
        elements.loadingStats.classList.remove('show');
    }
}

function showToast(message, type = 'info') {
    if (!elements.toast) return;
    
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 4000);
}

function showError(message) {
    showToast(message, 'error');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialization
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded - Initializing RegistryConsole...');
    
    // Initialize DOM elements first
    initializeElements();
    
    // Setup event listeners
    setupEventListeners();
    setupNavigation();
    
    // Check authentication status first
    const auth = await checkAuthStatus();
    
    // If authentication is enabled but user is not authenticated, 
    // the middleware will redirect to login page
    if (auth.authEnabled && !auth.authenticated) {
        console.log('Authentication required - redirecting to login...');
        return;
    }
    
    // Apply saved theme immediately for consistency with login page
    // This ensures theme continuity: if user selected dark mode on login,
    // they will see dark mode in the main app immediately
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        console.log(`🎨 Applying saved theme: ${savedTheme}`);
        applyTheme(savedTheme);
    }
    
    // Initialize settings system
    initializeSettings();
    
    // Initialize with home page
    switchPage('home');
});

// Navigate to repository details on home page
function navigateToRepository(repoName) {
    console.log(`🔄 Navigating to repository: ${repoName}`);
    
    // Switch to home page
    switchPage('home');
    
    // Wait for page transition and then load repository data
    setTimeout(async () => {
        try {
            // Ensure repositories are loaded
            if (repositories.length === 0) {
                await loadRepositories();
            }
            
            // Find the repository element
            const repoElement = document.querySelector(`[data-repo="${repoName}"]`);
            if (repoElement) {
                // Expand the repository
                const repoHeader = repoElement.querySelector('.repository-header');
                if (repoHeader) {
                    repoHeader.click();
                    
                    // Scroll to the repository
                    setTimeout(() => {
                        repoElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        // Highlight the repository temporarily
                        repoElement.classList.add('highlighted');
                        setTimeout(() => {
                            repoElement.classList.remove('highlighted');
                        }, 3000);
                    }, 100);
                }
            } else {
                console.warn(`Repository ${repoName} not found in the list`);
                showToast(`Repository ${repoName} not found`, 'warning');
            }
        } catch (error) {
            console.error('Error navigating to repository:', error);
            showToast('Error loading repository details', 'error');
        }
    }, 300); // Wait for page transition
}

// ===== SETTINGS MANAGEMENT SYSTEM =====

// Server-side settings cache
let serverSettings = null;
let autoRefreshTimer = null;

// Settings management functions
async function getServerSettings() {
    try {
        const response = await authenticatedFetch('/api/settings');
        if (!response) return null; // Authentication failed and redirected
        
        const data = await response.json();
        
        if (response.ok) {
            serverSettings = data;
            return data;
        } else {
            throw new Error(data.error || 'Failed to load settings');
        }
    } catch (error) {
        console.error('Error loading server settings:', error);
        showToast('Error loading settings', 'error');
        
        // Return default fallback settings
        return {
            defaultTheme: 'light',
            autoRefreshInterval: 300000,
            autoRefreshEnabled: true,
            notificationsEnabled: true,
            cacheEnabled: true,
            cacheTTL: 300000,
            statisticsExportEnabled: true,
            settingsExportEnabled: true,
            registryUrl: 'Unknown'
        };
    }
}

async function updateServerSettings(newSettings) {
    try {
        const response = await authenticatedFetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSettings)
        });
        if (!response) return null; // Authentication failed and redirected
        
        const data = await response.json();
        
        if (response.ok) {
            serverSettings = data.currentSettings;
            showToast('Settings updated successfully', 'success');
            return data;
        } else {
            throw new Error(data.error || 'Failed to update settings');
        }
    } catch (error) {
        console.error('Error updating server settings:', error);
        showToast('Error updating settings: ' + error.message, 'error');
        return null;
    }
}

async function resetServerSettings() {
    try {
        const response = await fetch('/api/settings/reset', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            serverSettings = data.currentSettings;
            showToast('Settings reset to defaults', 'success');
            return data;
        } else {
            throw new Error(data.error || 'Failed to reset settings');
        }
    } catch (error) {
        console.error('Error resetting settings:', error);
        showToast('Error resetting settings: ' + error.message, 'error');
        return null;
    }
}

async function loadSettingsData() {
    const settings = await getServerSettings();
    
    // Load registry URL
    const registryUrlInput = document.getElementById('registryUrl');
    if (registryUrlInput) {
        registryUrlInput.value = settings.registryUrl;
        registryUrlInput.placeholder = settings.registryUrl;
    }
    
    // Load refresh interval
    const refreshIntervalSelect = document.getElementById('refreshInterval');
    if (refreshIntervalSelect) {
        refreshIntervalSelect.value = settings.autoRefreshInterval;
        refreshIntervalSelect.addEventListener('change', handleRefreshIntervalChange);
    }
    
    // Load theme
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = settings.defaultTheme;
        themeSelect.addEventListener('change', handleThemeChange);
    }
    
    // Apply current settings
    applySettings(settings);
}

// Helper function to show setting status
function showSettingStatus(settingElement, status) {
    const indicator = settingElement.querySelector('.status-indicator');
    if (indicator) {
        indicator.className = `status-indicator ${status}`;
    }
}

// Enhanced settings handlers with visual feedback
async function handleRefreshIntervalChange(event) {
    const newInterval = parseInt(event.target.value);
    const settingItem = event.target.closest('.setting-item');
    
    const updateResult = await updateServerSettings({
        autoRefreshInterval: newInterval,
        autoRefreshEnabled: newInterval > 0
    });
    
    if (updateResult) {
        setupAutoRefresh(newInterval);
        showSettingStatus(settingItem, 'success');
    } else {
        showSettingStatus(settingItem, 'error');
        // Revert the select to previous value
        event.target.value = serverSettings?.autoRefreshInterval || 300000;
    }
}

async function handleThemeChange(event) {
    const newTheme = event.target.value;
    const settingItem = event.target.closest('.setting-item');
    
    const updateResult = await updateServerSettings({
        defaultTheme: newTheme
    });
    
    if (updateResult) {
        applyTheme(newTheme);
        showSettingStatus(settingItem, 'success');
    } else {
        showSettingStatus(settingItem, 'error');
        // Revert the select to previous value
        event.target.value = serverSettings?.defaultTheme || 'light';
    }
}

function applySettings(settings) {
    // Check localStorage first for theme consistency across login/main app
    const savedTheme = localStorage.getItem('theme');
    const themeToApply = savedTheme || settings.defaultTheme;
    
    // Apply theme
    applyTheme(themeToApply);
    
    // Setup auto-refresh
    if (settings.autoRefreshEnabled) {
        setupAutoRefresh(settings.autoRefreshInterval);
    }
}

function setupAutoRefresh(intervalMs) {
    // Clear existing timer
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
    
    // Setup new timer if interval is greater than 0
    if (intervalMs > 0) {
        autoRefreshTimer = setInterval(() => {
            console.log('Auto-refresh triggered');
            refreshData();
        }, intervalMs);
        
        console.log(`Auto-refresh set to ${intervalMs / 1000} seconds`);
    } else {
        console.log('Auto-refresh disabled');
    }
}

async function loadRegistryUrl() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        const registryUrlInput = document.getElementById('registryUrl');
        if (registryUrlInput && data.registryUrl) {
            registryUrlInput.value = data.registryUrl;
            registryUrlInput.placeholder = data.registryUrl;
        }
    } catch (error) {
        console.error('Error loading registry URL:', error);
        const registryUrlInput = document.getElementById('registryUrl');
        if (registryUrlInput) {
            registryUrlInput.placeholder = 'Error loading URL';
        }
    }
}

// Cache management functions
async function clearStatisticsCache() {
    try {
        const response = await fetch('/api/stats/refresh', { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            showToast('Statistics cache cleared successfully', 'success');
            // Refresh statistics if on analytics page
            if (currentPage === 'analytics') {
                await loadStatistics();
            }
        } else {
            throw new Error(data.error || 'Failed to clear cache');
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        showToast('Error clearing cache: ' + error.message, 'error');
    }
}

async function exportStatistics() {
    try {
        // First get the current statistics
        const response = await authenticatedFetch('/api/stats');
        if (!response) return; // Authentication failed and redirected
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch statistics');
        }
        
        // Create export data
        const exportData = {
            exportDate: new Date().toISOString(),
            registryUrl: registryConfig?.registryUrl || 'Unknown',
            statistics: data,
            metadata: {
                version: '1.0.0',
                generator: 'RegistryConsole',
                format: 'JSON'
            }
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registry-statistics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Statistics exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting statistics:', error);
        showToast('Error exporting statistics: ' + error.message, 'error');
    }
}

// Enhanced theme functions
async function toggleTheme() {
    // Check localStorage first for current theme state
    const currentTheme = localStorage.getItem('theme') || serverSettings?.defaultTheme || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply theme immediately for responsive UI
    applyTheme(newTheme);
    
    // Update server settings in background
    const updateResult = await updateServerSettings({
        defaultTheme: newTheme
    });
    
    if (updateResult) {
        // Update theme select if on settings page
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = newTheme;
        }
        showToast(`Theme changed to ${newTheme} mode`, 'success');
    } else {
        // If server update fails, revert theme
        applyTheme(currentTheme);
        showToast('Failed to save theme preference', 'error');
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    // Save theme to localStorage for consistency across pages
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else if (theme === 'auto') {
        // Auto theme based on system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const effectiveTheme = systemPrefersDark ? 'dark' : 'light';
        localStorage.setItem('theme', effectiveTheme);
        
        if (systemPrefersDark) {
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        } else {
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark-theme');
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
    }
}

// Settings reset function
async function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
        const result = await resetServerSettings();
        if (result) {
            // Reload settings in the UI
            await loadSettingsData();
        }
    }
}

// Settings import/export (using server settings)
async function exportSettings() {
    try {
        const settings = await getServerSettings();
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            settings: settings
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registry-console-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Settings exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting settings:', error);
        showToast('Error exporting settings: ' + error.message, 'error');
    }
}

async function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (importData.settings) {
                        // Update server settings with imported data
                        const updateResult = await updateServerSettings(importData.settings);
                        
                        if (updateResult) {
                            await loadSettingsData();
                            showToast('Settings imported successfully', 'success');
                        }
                    } else {
                        throw new Error('Invalid settings file format');
                    }
                } catch (error) {
                    console.error('Error importing settings:', error);
                    showToast('Error importing settings: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Initialize settings on page load
async function initializeSettings() {
    try {
        const settings = await getServerSettings();
        
        // Apply settings
        applySettings(settings);
        
        // Load registry config
        registryConfig = { registryUrl: settings.registryUrl };
        
        console.log('⚙️ Settings initialized from server:', settings);
    } catch (error) {
        console.error('Error initializing settings:', error);
        
        // Fallback to default settings
        const defaultSettings = {
            defaultTheme: 'light',
            autoRefreshInterval: 300000,
            autoRefreshEnabled: true
        };
        
        applySettings(defaultSettings);
    }
}
