// Debug script to test progress bars
console.log("🔍 Debug: Testing progress bars implementation");

// Test the API call
fetch('/api/stats')
    .then(response => response.json())
    .then(data => {
        console.log("📊 API Data received:", data);
        
        const repositories = data.repositories || [];
        console.log("📦 Repositories:", repositories.length);
        
        if (repositories.length > 0) {
            const topRepos = repositories.sort((a, b) => b.size - a.size).slice(0, 4);
            const totalSize = repositories.reduce((sum, repo) => sum + repo.size, 0);
            
            console.log("🏆 Top repositories:", topRepos.map(r => r.name));
            console.log("📏 Total size:", totalSize);
            
            topRepos.forEach((repo, index) => {
                const percentage = totalSize > 0 ? (repo.size / totalSize * 100).toFixed(1) : 0;
                console.log(`#${index + 1} ${repo.name}: ${percentage}%`);
            });
            
            // Test the topConsumers element
            const container = document.getElementById('topConsumers');
            if (container) {
                console.log("✅ topConsumers element found");
                console.log("📋 Current content:", container.innerHTML);
                
                // Try to update it with progress bars
                container.innerHTML = topRepos.map((repo, index) => {
                    const percentage = totalSize > 0 ? (repo.size / totalSize * 100).toFixed(1) : 0;
                    return `
                        <div class="repo-item clickable" style="border: 2px solid red; margin: 5px; padding: 10px;">
                            <div class="repo-name">DEBUG: ${repo.name}</div>
                            <div class="repo-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%; background: red; height: 8px;"></div>
                                </div>
                                <div class="progress-text">${percentage}% of total</div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                console.log("🎯 Progress bars injected with debug styling");
            } else {
                console.error("❌ topConsumers element not found");
            }
        }
    })
    .catch(error => {
        console.error("❌ Error loading data:", error);
    });
