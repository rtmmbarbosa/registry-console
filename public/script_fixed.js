// Global application state
let currentView = 'home';
let currentPage = 'home';
let repositories = [];
let statistics = {};
let deleteImageData = null;
let selectedItem = null;
let registryConfig = null;

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
        totalRepos: document.getElementById('totalRepos'),
        totalImages: document.getElementById('totalImages'),
        totalSize: document.getElementById('totalSize'),
        detailsPanel: document.getElementById('detailsPanel'),
        homeStats: document.getElementById('homeStats'),
        navItems: document.querySelectorAll('.nav-item'),
        pages: document.querySelectorAll('.page')
    };
}

// Navigation System
function switchPage(pageId) {
    currentPage = pageId;
    
    // Hide all pages
    elements.pages.forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // Update navigation buttons
    elements.navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Show/hide sidebar stats based on page
    if (elements.homeStats) {
        elements.homeStats.style.display = pageId === 'home' ? 'block' : 'none';
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
            // Load settings data
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
        const response = await fetch('/api/repositories');
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
            const response = await fetch(`/api/repositories/${repo}/tags`);
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
        const response = await fetch('/api/stats');
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
    if (elements.totalRepos) {
        elements.totalRepos.textContent = statistics.basic?.totalRepositories || 0;
    }
    if (elements.totalImages) {
        elements.totalImages.textContent = statistics.basic?.totalImages || 0;
    }
    if (elements.totalSize) {
        elements.totalSize.textContent = formatBytes(statistics.basic?.totalSize || 0);
    }
    
    // Update analytics page elements
    const analyticsElements = {
        analyticsRepos: document.getElementById('analyticsRepos'),
        analyticsImages: document.getElementById('analyticsImages'),
        analyticsSize: document.getElementById('analyticsSize'),
        analyticsHealth: document.getElementById('analyticsHealth'),
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
    if (analyticsElements.analyticsHealth) {
        const healthScore = calculateHealthScore(statistics);
        analyticsElements.analyticsHealth.textContent = `${healthScore}%`;
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
}

// Calculate health score
function calculateHealthScore(stats) {
    if (!stats || !stats.basic?.totalRepositories) return 0;
    
    const totalRepos = stats.basic.totalRepositories;
    const factors = {
        activeRepos: (stats.health?.activeRepos || 0) / totalRepos * 30,
        recentActivity: Math.min((stats.distribution?.tags?.latest || 0) / totalRepos * 20, 20),
        sizeEfficiency: Math.min(40 - (stats.basic?.totalSize || 0) / 1000000000 * 10, 40),
        diversity: Math.min(totalRepos / 50 * 10, 10)
    };
    
    return Math.round(factors.activeRepos + factors.recentActivity + factors.sizeEfficiency + factors.diversity);
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
        const manifestResponse = await fetch(`/api/repositories/${deleteImageData.repo}/manifests/${deleteImageData.tag}`, {
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
        
        const deleteResponse = await fetch(`/api/repositories/${deleteImageData.repo}/manifests/${digest}`, {
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
        const response = await fetch(`/api/repositories/${repoName}/manifests/${tagName}`);
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
                </div>
            </div>
            <div class="details-body">
                <div class="info-section">
                    <h4>Basic Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Schema Version</div>
                            <div class="info-value">${data.schemaVersion || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Media Type</div>
                            <div class="info-value">${data.mediaType || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Config Size</div>
                            <div class="info-value">${data.config?.size ? formatBytes(data.config.size) : 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Total Size</div>
                            <div class="info-value">${formatBytes(totalSize)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4>Layers (${data.layers?.length || 0})</h4>
                    <div class="layers-list">
                        ${data.layers?.map(layer => `
                            <div class="layer-item">
                                <div class="layer-digest">${layer.digest || 'N/A'}</div>
                                <div class="layer-size">${formatBytes(layer.size || 0)}</div>
                            </div>
                        `).join('') || '<div class="layer-item">No layers found</div>'}
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

// Theme functions
function toggleTheme() {
    const currentTheme = localStorage.getItem('registryConsoleTheme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    localStorage.setItem('registryConsoleTheme', newTheme);
    applyTheme(newTheme);
    
    showToast(`Theme changed to ${newTheme}`, 'success');
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
        root.classList.add('dark-theme');
    } else {
        root.classList.remove('dark-theme');
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing RegistryConsole...');
    
    // Initialize DOM elements first
    initializeElements();
    
    // Setup event listeners
    setupEventListeners();
    setupNavigation();
    
    // Initialize theme
    const savedTheme = localStorage.getItem('registryConsoleTheme') || 'light';
    applyTheme(savedTheme);
    
    // Initialize with home page
    switchPage('home');
});
