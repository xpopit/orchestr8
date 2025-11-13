// Visual Activity Timeline
// Real-time animated activity feed with grouping and filtering

class ActivityTimeline {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.activities = [];
        this.filteredActivities = [];
        this.currentFilter = 'all';
        this.isPaused = false;
        this.maxActivities = 500;

        this.init();
    }

    init() {
        this.enhanceActivityView();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    enhanceActivityView() {
        const activityView = document.getElementById('activityView');
        if (!activityView) return;

        // Add enhanced timeline container
        const feedContainer = activityView.querySelector('.activity-feed');
        if (feedContainer) {
            feedContainer.innerHTML = `
                <div class="timeline-container">
                    <div class="timeline-line"></div>
                    <div class="timeline-items" id="timelineItems">
                        <div class="timeline-empty">
                            <div class="empty-icon">📡</div>
                            <div class="empty-text">Waiting for activity...</div>
                            <div class="empty-hint">MCP requests will appear here in real-time</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Add statistics panel
        const controls = activityView.querySelector('.activity-controls');
        if (controls) {
            controls.insertAdjacentHTML('afterend', `
                <div class="activity-stats-panel">
                    <div class="stat-mini">
                        <span class="stat-mini-label">Total</span>
                        <span class="stat-mini-value" id="statTotal">0</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-label">Requests</span>
                        <span class="stat-mini-value" id="statRequests">0</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-label">Errors</span>
                        <span class="stat-mini-value error" id="statErrors">0</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-mini-label">Avg Time</span>
                        <span class="stat-mini-value" id="statAvgTime">-</span>
                    </div>
                </div>
            `);
        }
    }

    setupEventListeners() {
        // Hook into dashboard's activity updates
        const originalAddActivity = this.dashboard.addActivity.bind(this.dashboard);
        this.dashboard.addActivity = (activity) => {
            originalAddActivity(activity);
            this.onNewActivity(activity);
        };

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });

        // Pause button
        const pauseBtn = document.getElementById('pauseActivityBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
    }

    onNewActivity(activity) {
        if (this.isPaused) return;

        // Add timestamp if not present
        if (!activity.timestamp) {
            activity.timestamp = Date.now();
        }

        this.activities.unshift(activity);

        // Trim old activities
        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }

        // Update stats
        this.updateStats();

        // Render if on activity view
        if (this.dashboard.currentView === 'activity') {
            this.renderTimeline();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;

        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTimeline();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseActivityBtn');
        if (btn) {
            btn.textContent = this.isPaused ? 'Resume' : 'Pause';
            btn.classList.toggle('btn-primary', this.isPaused);
        }
    }

    renderTimeline() {
        const container = document.getElementById('timelineItems');
        if (!container) return;

        // Filter activities
        this.filteredActivities = this.currentFilter === 'all'
            ? this.activities
            : this.activities.filter(a => a.type === this.currentFilter);

        if (this.filteredActivities.length === 0) {
            container.innerHTML = `
                <div class="timeline-empty">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-text">No ${this.currentFilter} activities</div>
                    <div class="empty-hint">Try selecting a different filter</div>
                </div>
            `;
            return;
        }

        // Group by time (last hour, last day, older)
        const grouped = this.groupByTime(this.filteredActivities);

        const html = Object.entries(grouped).map(([group, activities]) => {
            return `
                <div class="timeline-group">
                    <div class="timeline-group-header">
                        <span class="timeline-group-title">${group}</span>
                        <span class="timeline-group-count">${activities.length} events</span>
                    </div>
                    ${activities.map((activity, index) => this.renderTimelineItem(activity, index)).join('')}
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Animate new items
        requestAnimationFrame(() => {
            container.querySelectorAll('.timeline-item').forEach((item, index) => {
                item.style.animationDelay = `${index * 0.03}s`;
            });
        });
    }

    renderTimelineItem(activity, index) {
        const icon = this.getActivityIcon(activity.type);
        const color = this.getActivityColor(activity.type);
        const time = this.formatTime(activity.timestamp);
        const detail = this.getActivityDetail(activity);
        const duration = this.getActivityDuration(activity);

        return `
            <div class="timeline-item" data-type="${activity.type}">
                <div class="timeline-marker" style="background: ${color}">
                    <span class="timeline-icon">${icon}</span>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-type">${this.formatType(activity.type)}</span>
                        <span class="timeline-time">${time}</span>
                    </div>
                    <div class="timeline-detail">${detail}</div>
                    ${duration ? `<div class="timeline-duration">${duration}</div>` : ''}
                </div>
            </div>
        `;
    }

    groupByTime(activities) {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;

        const groups = {
            'Last Hour': [],
            'Today': [],
            'Yesterday': [],
            'Older': []
        };

        activities.forEach(activity => {
            const age = now - activity.timestamp;

            if (age < oneHour) {
                groups['Last Hour'].push(activity);
            } else if (age < oneDay) {
                groups['Today'].push(activity);
            } else if (age < oneDay * 2) {
                groups['Yesterday'].push(activity);
            } else {
                groups['Older'].push(activity);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });

        return groups;
    }

    updateStats() {
        const total = this.activities.length;
        const requests = this.activities.filter(a => a.type === 'mcp_request').length;
        const errors = this.activities.filter(a => a.type === 'error').length;

        // Calculate average duration
        const durations = this.activities
            .filter(a => a.data?.duration)
            .map(a => a.data.duration);
        const avgTime = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;

        // Update display
        this.updateStatValue('statTotal', total);
        this.updateStatValue('statRequests', requests);
        this.updateStatValue('statErrors', errors);
        this.updateStatValue('statAvgTime', avgTime ? `${avgTime}ms` : '-');
    }

    updateStatValue(id, value) {
        const el = document.getElementById(id);
        if (el && el.textContent !== String(value)) {
            el.textContent = value;
            el.classList.add('stat-updated');
            setTimeout(() => el.classList.remove('stat-updated'), 500);
        }
    }

    getActivityIcon(type) {
        const icons = {
            'server_start': '🚀',
            'server_ready': '✅',
            'server_stop': '🛑',
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

    getActivityColor(type) {
        const colors = {
            'server_start': '#3fb950',
            'server_ready': '#3fb950',
            'server_stop': '#f85149',
            'mcp_request': '#58a6ff',
            'mcp_response': '#a371f7',
            'error': '#f85149',
            'log': '#8b949e'
        };
        return colors[type] || '#58a6ff';
    }

    formatType(type) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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

    getActivityDetail(activity) {
        const data = activity.data || {};

        switch (activity.type) {
            case 'mcp_request':
            case 'mcp_response':
                return `Method: <code>${data.method || 'unknown'}</code> (ID: ${data.id || 'N/A'})`;
            case 'prompts_list':
                return `Loaded ${data.count || 0} prompts`;
            case 'prompt_get':
                return `Prompt: <code>${data.name || 'unknown'}</code>`;
            case 'resources_list':
                return `Loaded ${data.count || 0} resources`;
            case 'resource_read':
                return `URI: <code>${data.uri || 'unknown'}</code>`;
            case 'error':
                return `<span class="error-text">${data.message || 'Unknown error'}</span>`;
            case 'log':
                return data.message || '';
            default:
                return JSON.stringify(data);
        }
    }

    getActivityDuration(activity) {
        const duration = activity.data?.duration;
        if (!duration) return null;

        if (duration < 100) {
            return `⚡ ${duration}ms`;
        } else if (duration < 1000) {
            return `${duration}ms`;
        } else {
            return `${(duration / 1000).toFixed(2)}s`;
        }
    }

    startAutoRefresh() {
        setInterval(() => {
            if (this.dashboard.currentView === 'activity' && !this.isPaused) {
                // Update relative times
                const items = document.querySelectorAll('.timeline-time');
                items.forEach((item, index) => {
                    const activity = this.filteredActivities[index];
                    if (activity) {
                        item.textContent = this.formatTime(activity.timestamp);
                    }
                });
            }
        }, 30000); // Update every 30 seconds
    }
}

// Initialize when dashboard is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.dashboard) {
            window.activityTimeline = new ActivityTimeline(window.dashboard);
        }
    }, 100);
});
