// ============================================
// ANALYTICS DASHBOARD
// Visualizes chatbot analytics data
// ============================================

class AnalyticsDashboard {
    constructor() {
        // Get API endpoint from config or use default
        // Priority: window.DASHBOARD_API_URL > auto-detect > localhost
        if (window.DASHBOARD_API_URL) {
            this.apiBaseUrl = window.DASHBOARD_API_URL;
        } else {
            // Try to auto-detect: if on same domain, use same origin
            // Otherwise default to localhost for development
            const hostname = window.location.hostname;
            if (hostname.includes('ondigitalocean.app') || hostname.includes('localhost')) {
                // For DigitalOcean or localhost, try same origin first
                this.apiBaseUrl = window.location.origin;
            } else {
                // For other domains, default to localhost (development)
                this.apiBaseUrl = 'http://localhost:3000';
            }
        }
        
        this.dashboardApiUrl = `${this.apiBaseUrl}/api/dashboard`;
        this.timeRange = 30;
        this.charts = {};
        
        console.log('Dashboard API URL:', this.dashboardApiUrl);
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboardData();
    }
    
    setupEventListeners() {
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.timeRange = parseInt(e.target.value);
            this.loadDashboardData();
        });
        
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboardData();
        });
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    async loadDashboardData() {
        this.showLoading();
        
        try {
            const [stats, orderSets, dropoffs, questions, completionRates] = await Promise.all([
                this.fetchData('/stats'),
                this.fetchData('/order-sets'),
                this.fetchData('/dropoffs'),
                this.fetchData('/questions'),
                this.fetchData('/completion-rates')
            ]);
            
            this.renderOverviewStats(stats);
            this.renderOrderSetStats(orderSets);
            this.renderOrderSetChart(orderSets);
            this.renderCompletionCharts(orderSets, completionRates);
            this.renderDropoffChart(dropoffs);
            this.renderDropoffTable(dropoffs);
            this.renderQuestionPerformance(questions);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            const errorMessage = error.message || 'Unknown error';
            const detailedMessage = `Failed to load analytics data. Please check your API connection.<br><br>
                <small style="font-size: 1.2rem; color: #666;">
                    Error: ${errorMessage}<br>
                    API URL: ${this.dashboardApiUrl}<br>
                    Make sure CORS is enabled on your API server.
                </small>`;
            this.showError(detailedMessage);
        } finally {
            this.hideLoading();
        }
    }
    
    async fetchData(endpoint) {
        const url = `${this.dashboardApiUrl}${endpoint}?days=${this.timeRange}`;
        console.log('Fetching:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors' // Explicitly set CORS mode
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`Successfully fetched ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    }
    
    renderOverviewStats(stats) {
        document.getElementById('totalSessions').textContent = stats.totalSessions || 0;
        document.getElementById('avgCompletion').textContent = 
            stats.avgCompletion ? `${stats.avgCompletion.toFixed(1)}%` : '0%';
        document.getElementById('totalEvents').textContent = stats.totalEvents || 0;
        document.getElementById('totalDropoffs').textContent = stats.totalDropoffs || 0;
    }
    
    renderOrderSetStats(orderSets) {
        const container = document.getElementById('orderSetStats');
        
        if (!orderSets || orderSets.length === 0) {
            container.innerHTML = '<p class="no-data">No order set data available</p>';
            return;
        }
        
        container.innerHTML = orderSets.map(set => {
            const totalSessions = set.totalSessions || 0;
            const highPct = totalSessions > 0 ? (set.highCompletionCount / totalSessions * 100).toFixed(1) : 0;
            const mediumPct = totalSessions > 0 ? (set.mediumCompletionCount / totalSessions * 100).toFixed(1) : 0;
            const lowPct = totalSessions > 0 ? (set.lowCompletionCount / totalSessions * 100).toFixed(1) : 0;
            
            return `
                <div class="order-set-card">
                    <h3 class="order-set-card__title">${set.name}</h3>
                    <div class="order-set-card__stats">
                        <div class="order-set-stat">
                            <span class="order-set-stat__value">${totalSessions}</span>
                            <span class="order-set-stat__label">Sessions</span>
                        </div>
                        <div class="order-set-stat">
                            <span class="order-set-stat__value">${(set.avgCompletion || 0).toFixed(1)}%</span>
                            <span class="order-set-stat__label">Avg Completion</span>
                        </div>
                    </div>
                    <div class="completion-breakdown">
                        <div class="completion-bar completion-bar--high" style="width: ${highPct}%" title="High (≥90%): ${set.highCompletionCount || 0}"></div>
                        <div class="completion-bar completion-bar--medium" style="width: ${mediumPct}%" title="Medium (50-89%): ${set.mediumCompletionCount || 0}"></div>
                        <div class="completion-bar completion-bar--low" style="width: ${lowPct}%" title="Low (<50%): ${set.lowCompletionCount || 0}"></div>
                    </div>
                    <div class="order-set-card__description">${set.description || ''}</div>
                </div>
            `;
        }).join('');
    }
    
    renderOrderSetChart(orderSets) {
        const ctx = document.getElementById('orderSetChart').getContext('2d');
        
        if (this.charts.orderSet) {
            this.charts.orderSet.destroy();
        }
        
        if (!orderSets || orderSets.length === 0) {
            return;
        }
        
        this.charts.orderSet = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: orderSets.map(s => s.name),
                datasets: [
                    {
                        label: 'Average Completion %',
                        data: orderSets.map(s => parseFloat(s.avgCompletion || 0)),
                        backgroundColor: 'rgba(2, 115, 197, 0.8)',
                        borderColor: 'rgba(2, 115, 197, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'High Completion (≥90%)',
                        data: orderSets.map(s => {
                            const total = s.totalSessions || 1;
                            return (s.highCompletionCount / total * 100) || 0;
                        }),
                        backgroundColor: 'rgba(74, 222, 128, 0.8)',
                        borderColor: 'rgba(74, 222, 128, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Order Set Performance Comparison'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderCompletionCharts(orderSets, completionRates) {
        // Bar chart
        const ctx1 = document.getElementById('completionChart').getContext('2d');
        if (this.charts.completion) {
            this.charts.completion.destroy();
        }
        
        if (orderSets && orderSets.length > 0) {
            this.charts.completion = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: orderSets.map(s => s.name),
                    datasets: [{
                        label: 'Average Completion %',
                        data: orderSets.map(s => parseFloat(s.avgCompletion || 0)),
                        backgroundColor: 'rgba(2, 115, 197, 0.8)',
                        borderColor: 'rgba(2, 115, 197, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Pie chart
        const ctx2 = document.getElementById('completionPieChart').getContext('2d');
        if (this.charts.completionPie) {
            this.charts.completionPie.destroy();
        }
        
        if (completionRates) {
            const total = (completionRates.high || 0) + (completionRates.medium || 0) + (completionRates.low || 0);
            
            if (total > 0) {
                this.charts.completionPie = new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: ['High (≥90%)', 'Medium (50-89%)', 'Low (<50%)'],
                        datasets: [{
                            data: [
                                completionRates.high || 0,
                                completionRates.medium || 0,
                                completionRates.low || 0
                            ],
                            backgroundColor: [
                                'rgba(74, 222, 128, 0.8)',
                                'rgba(234, 195, 68, 0.8)',
                                'rgba(239, 68, 68, 0.8)'
                            ],
                            borderColor: [
                                'rgba(74, 222, 128, 1)',
                                'rgba(234, 195, 68, 1)',
                                'rgba(239, 68, 68, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        }
    }
    
    renderDropoffChart(dropoffs) {
        const ctx = document.getElementById('dropoffChart').getContext('2d');
        
        if (this.charts.dropoff) {
            this.charts.dropoff.destroy();
        }
        
        if (!dropoffs || dropoffs.length === 0) {
            return;
        }
        
        // Group by order set
        const grouped = {};
        dropoffs.forEach(stat => {
            const key = stat.orderSetId || 'unknown';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(stat);
        });
        
        // Sort by question index
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => a.questionIndex - b.questionIndex);
        });
        
        const datasets = Object.keys(grouped).map((orderSetId, index) => {
            const data = grouped[orderSetId];
            return {
                label: `Order Set: ${orderSetId}`,
                data: data.map(d => ({
                    x: d.questionIndex,
                    y: d.dropoffCount
                })),
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                tension: 0.4,
                fill: false
            };
        });
        
        this.charts.dropoff = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Drop-offs by Question Index'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Question Index'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Drop-off Count'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    renderDropoffTable(dropoffs) {
        const tbody = document.querySelector('#dropoffTable tbody');
        
        if (!dropoffs || dropoffs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No drop-off data available</td></tr>';
            return;
        }
        
        tbody.innerHTML = dropoffs.slice(0, 20).map(stat => `
            <tr>
                <td>${stat.orderSetId || 'N/A'}</td>
                <td>Question ${stat.questionId || 'N/A'}</td>
                <td>${stat.questionIndex !== null ? stat.questionIndex : 'N/A'}</td>
                <td>${stat.dropoffCount || 0}</td>
                <td>${(stat.avgCompletionAtDropoff || 0).toFixed(1)}%</td>
            </tr>
        `).join('');
    }
    
    renderQuestionPerformance(questions) {
        const container = document.getElementById('questionPerformance');
        
        if (!questions || questions.length === 0) {
            container.innerHTML = '<p class="no-data">No question performance data available</p>';
            return;
        }
        
        // Group by order set
        const grouped = {};
        questions.forEach(q => {
            const key = q.orderSetId || 'unknown';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(q);
        });
        
        container.innerHTML = Object.keys(grouped).map(orderSetId => {
            const questions = grouped[orderSetId].sort((a, b) => a.questionIndex - b.questionIndex);
            
            return `
                <div class="question-performance-card">
                    <h3 class="question-performance-card__title">Order Set: ${orderSetId}</h3>
                    <div class="question-performance-list">
                        ${questions.map(q => `
                            <div class="question-performance-item">
                                <div class="question-performance-item__header">
                                    <span class="question-performance-item__index">Q${q.questionIndex + 1}</span>
                                    <span class="question-performance-item__id">Question ${q.questionId}</span>
                                </div>
                                <div class="question-performance-item__stats">
                                    <div class="question-stat">
                                        <span class="question-stat__label">Started:</span>
                                        <span class="question-stat__value">${q.startedCount || 0}</span>
                                    </div>
                                    <div class="question-stat">
                                        <span class="question-stat__label">Answered:</span>
                                        <span class="question-stat__value">${q.answeredCount || 0}</span>
                                    </div>
                                    <div class="question-stat">
                                        <span class="question-stat__label">Answer Rate:</span>
                                        <span class="question-stat__value">${q.answerRate || 0}%</span>
                                    </div>
                                    <div class="question-stat">
                                        <span class="question-stat__label">Avg Time:</span>
                                        <span class="question-stat__value">${q.avgTimeToAnswer ? (q.avgTimeToAnswer / 1000).toFixed(1) + 's' : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getColor(index, alpha = 1) {
        const colors = [
            `rgba(2, 115, 197, ${alpha})`,
            `rgba(234, 195, 68, ${alpha})`,
            `rgba(74, 222, 128, ${alpha})`,
            `rgba(239, 68, 68, ${alpha})`,
            `rgba(139, 92, 246, ${alpha})`,
            `rgba(236, 72, 153, ${alpha})`
        ];
        return colors[index % colors.length];
    }
    
    showError(message) {
        const container = document.querySelector('.dashboard-content');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <div style="text-align: left; max-width: 60rem; margin: 0 auto;">
                    ${message}
                </div>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});

