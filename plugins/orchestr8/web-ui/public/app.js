// Orchestr8 MCP Dashboard - Main Application
// Version 2.0.0

class Dashboard {
    constructor() {
        this.ws = null;
        this.currentView = 'overview';
        this.stats = {};
        this.resources = [];
        this.categories = [];
        this.activityLog = [];
        this.activityPaused = false;
        this.activeFilter = 'all';
        this.charts = {};

        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupEventListeners();
        this.loadInitialData();
        this.setupCharts();
    }

    // ============================================
    // WebSocket Connection
    // ============================================

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[WebSocket] Connected');
            this.updateConnectionStatus('connected');
            this.showToast('Connected to MCP server', 'success');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('[WebSocket] Parse error:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
            this.updateConnectionStatus('error');
            this.showToast('Connection error', 'error');
        };

        this.ws.onclose = () => {
            console.log('[WebSocket] Disconnected');
            this.updateConnectionStatus('disconnected');
            this.showToast('Disconnected from server', 'warning');

            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'stats':
                this.updateStats(message.data);
                break;
            case 'activity':
                this.addActivity(message.data);
                break;
            case 'activity_history':
                this.activityLog = message.data;
                this.renderActivityFeed();
                break;
            default:
                console.log('[WebSocket] Unknown message type:', message.type);
        }
    }

    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.classList.remove('connected', 'error');

        const statusText = statusEl.querySelector('.status-text');

        switch (status) {
            case 'connected':
                statusEl.classList.add('connected');
                statusText.textContent = 'Connected';
                break;
            case 'error':
            case 'disconnected':
                statusEl.classList.add('error');
                statusText.textContent = status === 'error' ? 'Connection Error' : 'Disconnected';
                break;
            default:
                statusText.textContent = 'Connecting...';
        }
    }

    // ============================================
    // Event Listeners
    // ============================================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });

        // Header buttons
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('clearLogsBtn').addEventListener('click', () => this.clearActivityLog());

        // Testing view
        document.getElementById('requestType').addEventListener('change', () => this.updateTestingForm());
        document.getElementById('executeTestBtn').addEventListener('click', () => this.executeTest());

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => this.loadExample(btn.dataset.example));
        });

        // Results tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchResultTab(btn.dataset.tab));
        });

        // Copy results button
        document.getElementById('copyResultsBtn').addEventListener('click', () => this.copyResults());

        // Resource search
        const searchInput = document.getElementById('resourceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterResources(e.target.value));
        }

        // View all activity button
        const viewAllBtn = document.getElementById('viewAllActivityBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.switchView('activity'));
        }

        // Activity filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setActivityFilter(btn.dataset.filter));
        });

        // Pause activity button
        const pauseBtn = document.getElementById('pauseActivityBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.toggleActivityPause());
        }

        // View type controls
        document.querySelectorAll('[data-view-type]').forEach(btn => {
            btn.addEventListener('click', () => this.setViewType(btn.dataset.viewType));
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });
    }

    // ============================================
    // View Management
    // ============================================

    switchView(viewName) {
        this.currentView = viewName;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}View`);
        });

        // Load view-specific data
        switch (viewName) {
            case 'explorer':
                this.loadResources();
                break;
            case 'activity':
                this.renderActivityFeed();
                break;
        }
    }

    // ============================================
    // Data Loading
    // ============================================

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadResources(),
                this.loadCategories()
            ]);
        } catch (error) {
            console.error('[Dashboard] Error loading initial data:', error);
            this.showToast('Error loading dashboard data', 'error');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            this.updateStats(stats);
        } catch (error) {
            console.error('[Dashboard] Error loading stats:', error);
        }
    }

    async loadResources() {
        try {
            const response = await fetch('/api/resources');
            const data = await response.json();

            if (data.result && data.result.resources) {
                this.resources = data.result.resources;
                this.renderResourceGrid();
                this.updateResourceCount();
            }
        } catch (error) {
            console.error('[Dashboard] Error loading resources:', error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/resources/categories');
            const categories = await response.json();

            this.categories = categories;
            this.renderCategories();
        } catch (error) {
            console.error('[Dashboard] Error loading categories:', error);
        }
    }

    async refreshData() {
        this.showToast('Refreshing data...', 'success');
        await this.loadInitialData();
    }

    // ============================================
    // Statistics Display
    // ============================================

    updateStats(stats) {
        this.stats = stats;

        // Update stat cards
        document.getElementById('uptimeValue').textContent = this.formatUptime(stats.uptime);
        document.getElementById('requestsValue').textContent = stats.requestCount || 0;
        document.getElementById('latencyValue').textContent = `${stats.latency?.avg || 0}ms`;
        document.getElementById('p95Value').textContent = `${stats.latency?.p95 || 0}ms`;
        document.getElementById('p99Value').textContent = `${stats.latency?.p99 || 0}ms`;
        document.getElementById('errorsValue').textContent = stats.errors || 0;
        document.getElementById('memoryValue').textContent = this.formatMemory(stats.memoryUsage?.heapUsed);

        // Update charts
        this.updateCharts(stats);
    }

    formatUptime(seconds) {
        if (!seconds) return '--';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    formatMemory(bytes) {
        if (!bytes) return '--';

        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)}MB`;
    }

    updateResourceCount() {
        document.getElementById('resourcesValue').textContent = this.resources.length;
    }

    // ============================================
    // Charts
    // ============================================

    setupCharts() {
        // Latency chart
        const latencyCtx = document.getElementById('latencyChart');
        if (latencyCtx) {
            this.charts.latency = new Chart(latencyCtx, {
                type: 'bar',
                data: {
                    labels: ['p50', 'p95', 'p99', 'avg'],
                    datasets: [{
                        label: 'Latency (ms)',
                        data: [0, 0, 0, 0],
                        backgroundColor: 'rgba(88, 166, 255, 0.6)',
                        borderColor: 'rgba(88, 166, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#8b949e' },
                            grid: { color: '#30363d' }
                        },
                        x: {
                            ticks: { color: '#8b949e' },
                            grid: { color: '#30363d' }
                        }
                    }
                }
            });
        }

        // Resource usage chart
        const resourceCtx = document.getElementById('resourceChart');
        if (resourceCtx) {
            this.charts.resource = new Chart(resourceCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            'rgba(88, 166, 255, 0.8)',
                            'rgba(163, 113, 247, 0.8)',
                            'rgba(63, 185, 80, 0.8)',
                            'rgba(210, 153, 34, 0.8)',
                            'rgba(248, 81, 73, 0.8)',
                            'rgba(121, 192, 255, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#8b949e' }
                        }
                    }
                }
            });
        }
    }

    updateCharts(stats) {
        // Update latency chart
        if (this.charts.latency && stats.latency) {
            this.charts.latency.data.datasets[0].data = [
                stats.latency.p50,
                stats.latency.p95,
                stats.latency.p99,
                stats.latency.avg
            ];
            this.charts.latency.update();
        }

        // Update resource usage chart
        if (this.charts.resource && stats.resourceUsage) {
            const labels = Object.keys(stats.resourceUsage);
            const data = Object.values(stats.resourceUsage);

            this.charts.resource.data.labels = labels;
            this.charts.resource.data.datasets[0].data = data;
            this.charts.resource.update();
        }
    }

    // ============================================
    // Activity Feed
    // ============================================

    addActivity(activity) {
        if (this.activityPaused) return;

        this.activityLog.push(activity);

        // Keep only last 1000 items
        if (this.activityLog.length > 1000) {
            this.activityLog.shift();
        }

        // Update recent activity in overview
        this.updateRecentActivity();

        // Update activity feed if visible
        if (this.currentView === 'activity') {
            this.renderActivityFeed();
        }
    }

    updateRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        const recent = this.activityLog.slice(-5).reverse();

        if (recent.length === 0) {
            container.innerHTML = '<div class="activity-empty">No activity yet</div>';
            return;
        }

        container.innerHTML = recent.map(activity => this.renderActivityItem(activity)).join('');
    }

    renderActivityFeed() {
        const container = document.getElementById('activityFeed');
        if (!container) return;

        let activities = [...this.activityLog].reverse();

        // Apply filter
        if (this.activeFilter !== 'all') {
            activities = activities.filter(a => a.type === this.activeFilter);
        }

        if (activities.length === 0) {
            container.innerHTML = '<div class="activity-empty">No activity to display</div>';
            return;
        }

        container.innerHTML = activities.map(activity => this.renderActivityItem(activity)).join('');
    }

    renderActivityItem(activity) {
        const icon = this.getActivityIcon(activity.type);
        const time = this.formatTime(activity.timestamp);
        const detail = this.getActivityDetail(activity);

        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.type.replace(/_/g, ' ')}</div>
                    <div class="activity-detail">${detail}</div>
                </div>
                <div class="activity-time">${time}</div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'server_start': '🚀',
            'server_ready': '✅',
            'server_stop': '🛑',
            'server_exit': '⏹️',
            'mcp_request': '📤',
            'mcp_response': '📥',
            'prompts_list': '📋',
            'prompt_get': '📄',
            'resources_list': '📦',
            'resource_read': '📖',
            'custom_request': '⚡',
            'error': '❌',
            'log': '📝'
        };
        return icons[type] || '•';
    }

    getActivityDetail(activity) {
        const data = activity.data || {};

        switch (activity.type) {
            case 'mcp_request':
            case 'mcp_response':
                return `Method: ${data.method || 'unknown'} (ID: ${data.id || 'N/A'})`;
            case 'prompts_list':
                return `Loaded ${data.count || 0} prompts`;
            case 'prompt_get':
                return `Prompt: ${data.name || 'unknown'}`;
            case 'resources_list':
                return `Loaded ${data.count || 0} resources`;
            case 'resource_read':
                return `URI: ${data.uri || 'unknown'}`;
            case 'error':
                return data.message || 'Unknown error';
            case 'log':
                return data.message || '';
            default:
                return JSON.stringify(data);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return date.toLocaleTimeString();
    }

    setActivityFilter(filter) {
        this.activeFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderActivityFeed();
    }

    toggleActivityPause() {
        this.activityPaused = !this.activityPaused;
        const btn = document.getElementById('pauseActivityBtn');
        btn.textContent = this.activityPaused ? 'Resume' : 'Pause';
        btn.classList.toggle('btn-primary', this.activityPaused);
    }

    clearActivityLog() {
        this.activityLog = [];
        this.updateRecentActivity();
        this.renderActivityFeed();
        this.showToast('Activity log cleared', 'success');
    }

    // ============================================
    // Testing Interface
    // ============================================

    updateTestingForm() {
        const type = document.getElementById('requestType').value;
        const container = document.getElementById('dynamicFormFields');

        let html = '';

        switch (type) {
            case 'prompts/get':
                html = `
                    <div class="form-group">
                        <label>Prompt Name</label>
                        <input type="text" id="promptName" class="form-control" placeholder="e.g., new-project">
                    </div>
                    <div class="form-group">
                        <label>Arguments (JSON)</label>
                        <textarea id="promptArgs" class="form-control" placeholder='{"key": "value"}'>{}</textarea>
                    </div>
                `;
                break;

            case 'resources/read':
                html = `
                    <div class="form-group">
                        <label>Resource URI</label>
                        <input type="text" id="resourceUri" class="form-control"
                               placeholder="orchestr8://agents/typescript-developer">
                    </div>
                `;
                break;

            default:
                html = '<div class="form-group"><p style="color: var(--text-secondary);">No additional parameters required</p></div>';
        }

        container.innerHTML = html;
    }

    async executeTest() {
        const type = document.getElementById('requestType').value;
        const btn = document.getElementById('executeTestBtn');

        btn.disabled = true;
        btn.textContent = 'Executing...';

        try {
            let result;

            switch (type) {
                case 'prompts/list':
                    result = await this.apiCall('/api/prompts', 'GET');
                    break;

                case 'prompts/get':
                    const promptName = document.getElementById('promptName')?.value;
                    const promptArgs = document.getElementById('promptArgs')?.value;

                    if (!promptName) {
                        throw new Error('Prompt name is required');
                    }

                    let args = {};
                    try {
                        args = JSON.parse(promptArgs || '{}');
                    } catch (e) {
                        throw new Error('Invalid JSON in arguments');
                    }

                    result = await this.apiCall('/api/prompts/get', 'POST', {
                        name: promptName,
                        arguments: args
                    });
                    break;

                case 'resources/list':
                    result = await this.apiCall('/api/resources', 'GET');
                    break;

                case 'resources/read':
                    const uri = document.getElementById('resourceUri')?.value;

                    if (!uri) {
                        throw new Error('Resource URI is required');
                    }

                    result = await this.apiCall('/api/resources/read', 'POST', { uri });
                    break;
            }

            this.displayTestResults(result, type);
            this.showToast('Test executed successfully', 'success');

        } catch (error) {
            console.error('[Testing] Error:', error);
            this.showToast(error.message, 'error');
            this.displayTestResults({ error: error.message }, type);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Execute Test';
        }
    }

    displayTestResults(result, type) {
        // Display protocol (raw JSON)
        const protocolTab = document.getElementById('protocolTab');
        protocolTab.querySelector('.code-block').textContent = JSON.stringify(result, null, 2);

        // Display formatted content
        const contentTab = document.getElementById('contentTab');
        const content = this.extractContent(result, type);
        contentTab.innerHTML = content;

        // Display metadata
        const metadataTab = document.getElementById('metadataTab');
        const metadata = this.extractMetadata(result, type);
        metadataTab.querySelector('.code-block').textContent = JSON.stringify(metadata, null, 2);

        // Update stats
        const stats = document.getElementById('resultsStats');
        const size = JSON.stringify(result).length;
        stats.textContent = `Response size: ${this.formatBytes(size)}`;
    }

    extractContent(result, type) {
        if (result.error) {
            return `<div class="results-empty" style="color: var(--accent-error);">Error: ${result.error}</div>`;
        }

        const data = result.result;

        if (!data) {
            return '<div class="results-empty">No content</div>';
        }

        // Handle different response types
        if (type === 'prompts/list' && data.prompts) {
            return this.formatPromptsList(data.prompts);
        }

        if (type === 'prompts/get' && data.messages) {
            return this.formatPromptContent(data.messages);
        }

        if (type === 'resources/list' && data.resources) {
            return this.formatResourcesList(data.resources);
        }

        if (type === 'resources/read' && data.contents) {
            return this.formatResourceContent(data.contents);
        }

        return `<pre class="code-block">${JSON.stringify(data, null, 2)}</pre>`;
    }

    formatPromptsList(prompts) {
        return `
            <div class="markdown-content">
                <h3>Available Prompts (${prompts.length})</h3>
                <ul>
                    ${prompts.map(p => `
                        <li>
                            <strong>${p.name}</strong>: ${p.description || 'No description'}
                            ${p.arguments ? `<br><small>Arguments: ${p.arguments.map(a => a.name).join(', ')}</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    formatPromptContent(messages) {
        return `
            <div class="markdown-content">
                ${messages.map(msg => {
                    const text = msg.content.text || msg.content;
                    return `<div>${marked.parse(text)}</div>`;
                }).join('')}
            </div>
        `;
    }

    formatResourcesList(resources) {
        return `
            <div class="markdown-content">
                <h3>Available Resources (${resources.length})</h3>
                <ul>
                    ${resources.map(r => `
                        <li>
                            <strong>${r.name}</strong><br>
                            <small>${r.uri}</small><br>
                            ${r.description ? `<small>${r.description}</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    formatResourceContent(contents) {
        const content = contents[0];
        if (content.mimeType === 'text/markdown' || content.mimeType === 'text/plain') {
            return `<div class="markdown-content">${marked.parse(content.text)}</div>`;
        }
        return `<pre class="code-block">${content.text}</pre>`;
    }

    extractMetadata(result, type) {
        if (result.error) {
            return { error: result.error };
        }

        const metadata = {
            type,
            timestamp: new Date().toISOString()
        };

        if (result.result) {
            if (result.result.prompts) {
                metadata.count = result.result.prompts.length;
            }
            if (result.result.resources) {
                metadata.count = result.result.resources.length;
            }
            if (result.result.messages) {
                metadata.messageCount = result.result.messages.length;
            }
            if (result.result.contents) {
                metadata.contentCount = result.result.contents.length;
                metadata.mimeType = result.result.contents[0]?.mimeType;
            }
        }

        return metadata;
    }

    loadExample(exampleName) {
        const typeSelect = document.getElementById('requestType');

        switch (exampleName) {
            case 'list-prompts':
                typeSelect.value = 'prompts/list';
                break;

            case 'list-resources':
                typeSelect.value = 'resources/list';
                break;

            case 'typescript-agent':
                typeSelect.value = 'resources/read';
                this.updateTestingForm();
                setTimeout(() => {
                    document.getElementById('resourceUri').value = 'orchestr8://agents/typescript-developer';
                }, 100);
                break;

            case 'match-api':
                typeSelect.value = 'resources/read';
                this.updateTestingForm();
                setTimeout(() => {
                    document.getElementById('resourceUri').value = 'orchestr8://skills/match?query=api+development&maxTokens=2000';
                }, 100);
                break;

            case 'match-fullstack':
                typeSelect.value = 'resources/read';
                this.updateTestingForm();
                setTimeout(() => {
                    document.getElementById('resourceUri').value = 'orchestr8://match?query=full+stack+development&categories=agent,skill,example&maxTokens=3000';
                }, 100);
                break;
        }

        this.updateTestingForm();
    }

    switchResultTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    copyResults() {
        const activeTab = document.querySelector('.tab-content.active');
        const text = activeTab.textContent;

        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard', 'success');
        }).catch(err => {
            this.showToast('Failed to copy', 'error');
        });
    }

    // ============================================
    // Resource Explorer
    // ============================================

    renderCategories() {
        const container = document.getElementById('categoryList');
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = '<div class="loading">No categories</div>';
            return;
        }

        container.innerHTML = `
            <div class="category-item active" data-category="all">
                <span class="category-name">All Resources</span>
                <span class="category-count">${this.resources.length}</span>
            </div>
            ${this.categories.map(cat => `
                <div class="category-item" data-category="${cat.category}">
                    <span class="category-name">${cat.category}</span>
                    <span class="category-count">${cat.count}</span>
                </div>
            `).join('')}
        `;

        // Add click handlers
        container.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                container.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.filterByCategory(item.dataset.category);
            });
        });
    }

    renderResourceGrid() {
        const container = document.getElementById('resourceGrid');
        if (!container) return;

        if (this.resources.length === 0) {
            container.innerHTML = '<div class="loading">No resources found</div>';
            return;
        }

        container.innerHTML = this.resources.map(resource => {
            const category = this.extractCategory(resource.uri);
            const icon = this.getResourceIcon(category);

            return `
                <div class="resource-card" data-uri="${resource.uri}">
                    <div class="resource-header">
                        <div class="resource-icon">${icon}</div>
                        <div class="resource-info">
                            <div class="resource-name">${resource.name}</div>
                            <div class="resource-category">${category || 'unknown'}</div>
                        </div>
                    </div>
                    <div class="resource-description">
                        ${resource.description || 'No description available'}
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.resource-card').forEach(card => {
            card.addEventListener('click', () => this.openResourceModal(card.dataset.uri));
        });
    }

    getResourceIcon(category) {
        const icons = {
            'agents': '🤖',
            'skills': '⚡',
            'examples': '📚',
            'patterns': '🔄',
            'guides': '📖',
            'best-practices': '✨'
        };
        return icons[category] || '📄';
    }

    extractCategory(uri) {
        const match = uri.match(/^orchestr8:\/\/([^/?]+)/);
        return match ? match[1] : null;
    }

    filterResources(query) {
        const filtered = this.resources.filter(r =>
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.description?.toLowerCase().includes(query.toLowerCase()) ||
            r.uri.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredResources(filtered);
    }

    filterByCategory(category) {
        if (category === 'all') {
            this.renderResourceGrid();
            return;
        }

        const filtered = this.resources.filter(r => {
            const cat = this.extractCategory(r.uri);
            return cat === category;
        });

        this.renderFilteredResources(filtered);
    }

    renderFilteredResources(resources) {
        const container = document.getElementById('resourceGrid');
        if (!container) return;

        if (resources.length === 0) {
            container.innerHTML = '<div class="activity-empty">No resources match your filter</div>';
            return;
        }

        const tempResources = this.resources;
        this.resources = resources;
        this.renderResourceGrid();
        this.resources = tempResources;
    }

    async openResourceModal(uri) {
        const modal = document.getElementById('resourceModal');
        const nameEl = document.getElementById('modalResourceName');
        const contentEl = document.getElementById('modalResourceContent');

        modal.classList.add('active');
        nameEl.textContent = uri;
        contentEl.innerHTML = '<div class="loading">Loading resource...</div>';

        try {
            const result = await this.apiCall('/api/resources/read', 'POST', { uri });

            if (result.error) {
                contentEl.innerHTML = `<div style="color: var(--accent-error);">Error: ${result.error}</div>`;
                return;
            }

            const content = result.result?.contents?.[0];
            if (content) {
                const html = `<div class="markdown-content">${marked.parse(content.text)}</div>`;
                contentEl.innerHTML = html;
            } else {
                contentEl.innerHTML = '<div class="results-empty">No content available</div>';
            }
        } catch (error) {
            contentEl.innerHTML = `<div style="color: var(--accent-error);">Error: ${error.message}</div>`;
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    setViewType(type) {
        document.querySelectorAll('[data-view-type]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.viewType === type);
        });

        const grid = document.getElementById('resourceGrid');
        if (type === 'list') {
            grid.style.gridTemplateColumns = '1fr';
        } else {
            grid.style.gridTemplateColumns = '';
        }
    }

    // ============================================
    // API Helpers
    // ============================================

    async apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // ============================================
    // Utilities
    // ============================================

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');

        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
