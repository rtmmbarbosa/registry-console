// Global application state
let currentView = 'repositories';
let repositories = [];
let statistics = {};
let deleteImageData = null;
let selectedItem = null;

// DOM elements
const elements = {
    btnRepositories: document.getElementById('btnRepositories'),
    btnStatistics: document.getElementById('btnStatistics'),
    btnRefresh: document.getElementById('btnRefresh'),
    repositoriesSection: document.getElementById('repositories'),
    statisticsSection: document.getElementById('statistics'),
    repositoriesList: document.getElementById('repositoriesList'),
    statisticsContent: document.getElementById('statisticsContent'),
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
    repoStatsList: document.getElementById('repoStatsList'),
    detailsPanel: document.getElementById('detailsPanel')
};

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadRepositories();
});

// Event Listeners
function setupEventListeners() {
    elements.btnRepositories.addEventListener('click', () => switchView('repositories'));
    elements.btnStatistics.addEventListener('click', () => switchView('statistics'));
    elements.btnRefresh.addEventListener('click', refreshCurrentView);
    elements.confirmDelete.addEventListener('click', confirmDeleteImage);
    elements.cancelDelete.addEventListener('click', closeDeleteModal);
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            closeDeleteModal();
        }
    });
}

// Navigation between views
function switchView(view) {
    currentView = view;
    
    // Update buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (view === 'repositories') {
        elements.btnRepositories.classList.add('active');
        elements.repositoriesSection.classList.add('active');
        elements.statisticsSection.classList.remove('active');
        if (repositories.length === 0) {
            loadRepositories();
        }
    } else if (view === 'statistics') {
        elements.btnStatistics.classList.add('active');
        elements.statisticsSection.classList.add('active');
        elements.repositoriesSection.classList.remove('active');
        loadStatistics();
    }
}

// Refresh current view
function refreshCurrentView() {
    if (currentView === 'repositories') {
        loadRepositories();
    } else if (currentView === 'statistics') {
        loadStatistics();
    }
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
            const isExpanded = repoItem.classList.contains('expanded');
            
            // Close all other repositories
            document.querySelectorAll('.repository-item').forEach(item => {
                item.classList.remove('expanded');
            });
            
            // Toggle current repository
            if (!isExpanded) {
                repoItem.classList.add('expanded');
            }
        });
    });
    
    // Tag items - show details
    document.querySelectorAll('.tag-item').forEach(tagItem => {
        tagItem.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn')) return; // Don't trigger on button clicks
            
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
        elements.statisticsContent.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
    } finally {
        hideLoading('stats');
    }
}

// Display statistics
function displayStatistics() {
    elements.totalRepos.textContent = statistics.totalRepositories || 0;
    elements.totalImages.textContent = statistics.totalImages || 0;
    elements.totalSize.textContent = formatBytes(statistics.totalSize || 0);
    
    const repoStats = statistics.repositories || [];
    if (repoStats.length === 0) {
        elements.repoStatsList.innerHTML = `
            <div class="empty-state">
                <h3>No statistics available</h3>
                <p>No detailed statistics were found.</p>
            </div>
        `;
    } else {
        elements.repoStatsList.innerHTML = `
            <h3>Repository Details</h3>
            ${repoStats.map(repo => `
                <div class="repo-stat-item">
                    <div class="repo-stat-name">${repo.name}</div>
                    <div class="repo-stat-details">
                        <span>${repo.tags} tags</span>
                        <span>${formatBytes(repo.size)}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }
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
        // First, get the manifest digest
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
        
        // Delete the image
        const deleteResponse = await fetch(`/api/repositories/${deleteImageData.repo}/manifests/${digest}`, {
            method: 'DELETE'
        });
        
        const result = await deleteResponse.json();
        
        if (!deleteResponse.ok) {
            throw new Error(result.error || 'Error deleting image');
        }
        
        showToast('Image deleted successfully!', 'success');
        closeDeleteModal();
        
        // Refresh current view
        setTimeout(() => {
            refreshCurrentView();
        }, 1000);
        
    } catch (error) {
        showError('Error deleting image: ' + error.message);
    }
}

// Show image details in right panel
async function showImageDetails(repoName, tagName) {
    selectedItem = { repo: repoName, tag: tagName };
    
    // Show loading state
    elements.detailsPanel.innerHTML = `
        <div class="details-content">
            <div class="details-placeholder">
                <div class="placeholder-icon">⏳</div>
                <h3>Loading details...</h3>
                <p>Please wait while we fetch the image information</p>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/repositories/${repoName}/manifests/${tagName}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error getting manifest');
        }
        
        // Calculate total size from config and layers
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
        
        // Create details HTML
        const detailsHtml = `
            <div class="details-content">
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
                        <h4>Configuration</h4>
                        <div class="info-item">
                            <div class="info-label">Config Digest</div>
                            <div class="info-value mono">${data.config?.digest || 'N/A'}</div>
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
            </div>
        `;
        
        elements.detailsPanel.innerHTML = detailsHtml;
        
    } catch (error) {
        elements.detailsPanel.innerHTML = `
            <div class="details-content">
                <div class="details-placeholder">
                    <div class="placeholder-icon">❌</div>
                    <h3>Error loading details</h3>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Utilities
function showLoading(type) {
    if (type === 'repos') {
        elements.loadingRepos.classList.add('show');
    } else if (type === 'stats') {
        elements.loadingStats.classList.add('show');
    }
}

function hideLoading(type) {
    if (type === 'repos') {
        elements.loadingRepos.classList.remove('show');
    } else if (type === 'stats') {
        elements.loadingStats.classList.remove('show');
    }
}

function showToast(message, type = 'info') {
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
