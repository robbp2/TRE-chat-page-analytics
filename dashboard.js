// ============================================
// MODERN ANALYTICS DASHBOARD
// Sleek, actionable insights
// ============================================

class AnalyticsDashboard {
    constructor() {
        // Get API endpoint from config or use default
        if (window.DASHBOARD_API_URL) {
            this.apiBaseUrl = window.DASHBOARD_API_URL;
        } else {
            const hostname = window.location.hostname;
            if (hostname.includes('ondigitalocean.app') || hostname.includes('localhost')) {
                this.apiBaseUrl = window.location.origin;
            } else {
                this.apiBaseUrl = 'http://localhost:3000';
            }
        }
        
        this.dashboardApiUrl = `${this.apiBaseUrl}/api/dashboard`;
        this.timeRange = 30;
        this.charts = {};
        
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
            
            this.renderOverviewStats(stats, completionRates);
            this.renderCriticalInsights(dropoffs, questions, stats);
            this.renderOpportunityInsights(questions, dropoffs, stats);
            this.renderCompletionCharts(orderSets, completionRates);
            this.renderTopDropoffs(dropoffs);
            this.renderQuestionPerformance(questions);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError(`Failed to load analytics data. Please check your API connection.`);
        } finally {
            this.hideLoading();
        }
    }
    
    async fetchData(endpoint) {
        const url = `${this.dashboardApiUrl}${endpoint}?days=${this.timeRange}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    }
    
    renderOverviewStats(stats, completionRates) {
        // Format numbers with commas
        const formatNumber = (num) => (num || 0).toLocaleString();
        
        document.getElementById('totalSessions').textContent = formatNumber(stats.totalSessions || 0);
        
        const avgCompletion = stats.avgCompletion || 0;
        document.getElementById('avgCompletion').textContent = `${avgCompletion.toFixed(1)}%`;
        
        // Completion breakdown
        const total = (completionRates?.high || 0) + (completionRates?.medium || 0) + (completionRates?.low || 0);
        if (total > 0) {
            const highPct = ((completionRates.high / total) * 100).toFixed(0);
            document.getElementById('completionBreakdown').textContent = `${highPct}% high completion`;
        }
        
        // Dropoffs
        const dropoffs = stats.totalDropoffs || 0;
        const sessions = stats.totalSessions || 1;
        const dropoffRate = (dropoffs / sessions * 100).toFixed(1);
        document.getElementById('totalDropoffs').textContent = formatNumber(dropoffs);
        document.getElementById('dropoffRate').textContent = `${dropoffRate}% drop-off rate`;
        
        // Average time
        const avgTime = stats.avgTime || 0;
        const avgTimeSeconds = Math.round(avgTime / 1000);
        const avgTimeMinutes = Math.floor(avgTimeSeconds / 60);
        const avgTimeSecs = avgTimeSeconds % 60;
        const timeDisplay = avgTimeMinutes > 0 
            ? `${avgTimeMinutes}m ${avgTimeSecs}s`
            : `${avgTimeSecs}s`;
        document.getElementById('avgTime').textContent = timeDisplay;
    }
    
    renderCriticalInsights(dropoffs, questions, stats) {
        const container = document.getElementById('criticalInsights');
        const insights = [];
        
        if (!dropoffs || dropoffs.length === 0) {
            container.innerHTML = '<div class="insight-item"><span>No critical issues detected</span></div>';
            return;
        }
        
        // Find highest drop-off question
        const topDropoff = dropoffs[0];
        if (topDropoff && topDropoff.dropoffCount > 0) {
            insights.push({
                icon: 'fas fa-exclamation-circle',
                text: `Question ${topDropoff.questionIndex + 1} has the highest drop-off rate with <strong>${topDropoff.dropoffCount} drop-offs</strong> (${topDropoff.avgCompletionAtDropoff.toFixed(1)}% avg completion)`,
                severity: 'high'
            });
        }
        
        // Find questions with low answer rates
        if (questions && questions.length > 0) {
            const lowAnswerRate = questions.filter(q => {
                const rate = parseFloat(q.answerRate || 0);
                return rate > 0 && rate < 50;
            }).sort((a, b) => parseFloat(a.answerRate) - parseFloat(b.answerRate))[0];
            
            if (lowAnswerRate) {
                insights.push({
                    icon: 'fas fa-question-circle',
                    text: `Question ${lowAnswerRate.questionIndex + 1} has low engagement: <strong>${parseFloat(lowAnswerRate.answerRate).toFixed(1)}% answer rate</strong>`,
                    severity: 'medium'
                });
            }
        }
        
        // Overall completion rate warning
        const avgCompletion = stats.avgCompletion || 0;
        if (avgCompletion < 50) {
            insights.push({
                icon: 'fas fa-chart-line-down',
                text: `Overall completion rate is <strong>${avgCompletion.toFixed(1)}%</strong> - below target threshold`,
                severity: 'high'
            });
        }
        
        if (insights.length === 0) {
            container.innerHTML = '<div class="insight-item"><span>No critical issues detected</span></div>';
        } else {
            container.innerHTML = insights.map(insight => `
                <div class="insight-item">
                    <i class="${insight.icon}"></i>
                    <span>${insight.text}</span>
                </div>
            `).join('');
        }
    }
    
    renderOpportunityInsights(questions, dropoffs, stats) {
        const container = document.getElementById('opportunityInsights');
        const insights = [];
        
        // Find best performing questions
        if (questions && questions.length > 0) {
            const highPerformers = questions
                .filter(q => parseFloat(q.answerRate || 0) >= 80)
                .sort((a, b) => parseFloat(b.answerRate) - parseFloat(a.answerRate))
                .slice(0, 2);
            
            highPerformers.forEach(q => {
                insights.push({
                    icon: 'fas fa-star',
                    text: `Question ${q.questionIndex + 1} performs well: <strong>${parseFloat(q.answerRate).toFixed(1)}% answer rate</strong> - consider similar approach for other questions`,
                    severity: 'positive'
                });
            });
        }
        
        // Completion rate opportunity
        const avgCompletion = stats.avgCompletion || 0;
        if (avgCompletion >= 70 && avgCompletion < 90) {
            insights.push({
                icon: 'fas fa-arrow-up',
                text: `Completion rate is <strong>${avgCompletion.toFixed(1)}%</strong> - close to excellent. Focus on reducing drop-offs to reach 90%+`,
                severity: 'positive'
            });
        }
        
        // Low drop-off opportunity
        const dropoffRate = stats.totalSessions > 0 
            ? ((stats.totalDropoffs || 0) / stats.totalSessions * 100)
            : 0;
        if (dropoffRate < 20 && dropoffRate > 0) {
            insights.push({
                icon: 'fas fa-check-double',
                text: `Drop-off rate is only <strong>${dropoffRate.toFixed(1)}%</strong> - excellent retention!`,
                severity: 'positive'
            });
        }
        
        if (insights.length === 0) {
            insights.push({
                icon: 'fas fa-info-circle',
                text: 'Continue monitoring for optimization opportunities',
                severity: 'info'
            });
        }
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i class="${insight.icon}"></i>
                <span>${insight.text}</span>
            </div>
        `).join('');
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
                    datasets: [
                        {
                            label: 'High Completion (≥90%)',
                            data: orderSets.map(s => {
                                const total = s.totalSessions || 1;
                                return (s.highCompletionCount / total * 100) || 0;
                            }),
                            backgroundColor: 'rgba(74, 222, 128, 0.9)',
                            borderColor: 'rgba(74, 222, 128, 1)',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Medium Completion (50-89%)',
                            data: orderSets.map(s => {
                                const total = s.totalSessions || 1;
                                return (s.mediumCompletionCount / total * 100) || 0;
                            }),
                            backgroundColor: 'rgba(234, 195, 68, 0.9)',
                            borderColor: 'rgba(234, 195, 68, 1)',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Low Completion (<50%)',
                            data: orderSets.map(s => {
                                const total = s.totalSessions || 1;
                                return (s.lowCompletionCount / total * 100) || 0;
                            }),
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 2,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { family: 'Poppins', size: 12 },
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { family: 'Poppins', size: 14, weight: '600' },
                            bodyFont: { family: 'Poppins', size: 13 },
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { font: { family: 'Poppins', size: 12 } }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                callback: function(value) { return value + '%'; },
                                font: { family: 'Poppins', size: 12 }
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
                                'rgba(74, 222, 128, 0.9)',
                                'rgba(234, 195, 68, 0.9)',
                                'rgba(239, 68, 68, 0.9)'
                            ],
                            borderColor: '#ffffff',
                            borderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { family: 'Poppins', size: 11 },
                                    padding: 12,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                padding: 12,
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                        return `${label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    
    renderTopDropoffs(dropoffs) {
        const container = document.getElementById('topDropoffs');
        
        if (!dropoffs || dropoffs.length === 0) {
            container.innerHTML = '<div class="no-data">No drop-off data available</div>';
            return;
        }
        
        // Show top 5 drop-offs
        const top5 = dropoffs.slice(0, 5);
        
        container.innerHTML = top5.map(stat => `
            <div class="dropoff-item">
                <div class="dropoff-item__header">
                    <span class="dropoff-item__question">
                        <span class="dropoff-item__index">Q${(stat.questionIndex || 0) + 1}</span>
                        Question ${stat.questionId || 'N/A'}
                    </span>
                    <span class="dropoff-item__count">${stat.dropoffCount || 0}</span>
                </div>
                <div class="dropoff-item__details">
                    Avg completion: ${(stat.avgCompletionAtDropoff || 0).toFixed(1)}% at drop-off
                </div>
            </div>
        `).join('');
    }
    
    renderDropoffChart(dropoffs) {
        const ctx = document.getElementById('dropoffChart').getContext('2d');
        
        if (this.charts.dropoff) {
            this.charts.dropoff.destroy();
        }
        
        if (!dropoffs || dropoffs.length === 0) {
            return;
        }
        
        // Group by order set and sort by question index
        const grouped = {};
        dropoffs.forEach(stat => {
            const key = stat.orderSetId || 'default';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(stat);
        });
        
        // Sort each group by question index
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
        });
        
        const datasets = Object.keys(grouped).map((orderSetId, index) => {
            const data = grouped[orderSetId];
            return {
                label: `Order Set: ${orderSetId}`,
                data: data.map(d => ({
                    x: d.questionIndex || 0,
                    y: d.dropoffCount || 0
                })),
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                borderWidth: 3,
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            };
        });
        
        this.charts.dropoff = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Poppins', size: 12 },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            title: function(context) {
                                return `Question ${context[0].raw.x + 1}`;
                            },
                            label: function(context) {
                                return `Drop-offs: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Question Number',
                            font: { family: 'Poppins', size: 13, weight: '600' }
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            stepSize: 1,
                            font: { family: 'Poppins', size: 11 }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Drop-off Count',
                            font: { family: 'Poppins', size: 13, weight: '600' }
                        },
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { family: 'Poppins', size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    renderQuestionPerformance(questions) {
        const container = document.getElementById('questionPerformance');
        
        if (!questions || questions.length === 0) {
            container.innerHTML = '<div class="no-data">No question performance data available</div>';
            return;
        }
        
        // Group by order set
        const grouped = {};
        questions.forEach(q => {
            const key = q.orderSetId || 'default';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(q);
        });
        
        // Clear container and create waterfall for each order set
        container.innerHTML = '';
        
        Object.keys(grouped).forEach((orderSetId, setIndex) => {
            const questionList = grouped[orderSetId].sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
            
            // Calculate waterfall data
            const waterfallData = this.calculateWaterfallData(questionList);
            
            // Create waterfall chart container
            const waterfallCard = document.createElement('div');
            waterfallCard.className = 'waterfall-card';
            waterfallCard.innerHTML = `
                <div class="waterfall-header">
                    <h3>Order Set: ${orderSetId}</h3>
                    <div class="waterfall-stats">
                        <span class="waterfall-stat">
                            <span class="waterfall-stat__value">${waterfallData.totalStarted}</span>
                            <span class="waterfall-stat__label">Started</span>
                        </span>
                        <span class="waterfall-stat">
                            <span class="waterfall-stat__value">${waterfallData.totalCompleted}</span>
                            <span class="waterfall-stat__label">Completed</span>
                        </span>
                        <span class="waterfall-stat">
                            <span class="waterfall-stat__value">${waterfallData.completionRate.toFixed(1)}%</span>
                            <span class="waterfall-stat__label">Completion Rate</span>
                        </span>
                    </div>
                </div>
                <div class="waterfall-chart-wrapper">
                    <canvas id="waterfallChart_${setIndex}"></canvas>
                </div>
            `;
            container.appendChild(waterfallCard);
            
            // Render waterfall chart
            setTimeout(() => {
                this.renderWaterfallChart(`waterfallChart_${setIndex}`, waterfallData, orderSetId);
            }, 100);
        });
    }
    
    calculateWaterfallData(questionList) {
        // Sort by question index
        const sorted = [...questionList].sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
        
        if (sorted.length === 0) {
            return {
                labels: [],
                started: [],
                answered: [],
                dropped: [],
                totalStarted: 0,
                totalCompleted: 0,
                completionRate: 0
            };
        }
        
        const labels = [];
        const started = [];
        const answered = [];
        const dropped = [];
        
        let currentFlow = sorted[0].startedCount || 0; // Start with first question's started count
        
        sorted.forEach((q, index) => {
            const qIndex = q.questionIndex !== null ? q.questionIndex : index;
            labels.push(`Q${qIndex + 1}`);
            
            const startedCount = q.startedCount || 0;
            const answeredCount = q.answeredCount || 0;
            const droppedCount = startedCount - answeredCount;
            
            started.push(startedCount);
            answered.push(answeredCount);
            dropped.push(droppedCount);
        });
        
        // Calculate totals
        const totalStarted = sorted[0]?.startedCount || 0;
        const totalCompleted = sorted[sorted.length - 1]?.answeredCount || 0;
        const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted * 100) : 0;
        
        return {
            labels,
            started,
            answered,
            dropped,
            totalStarted,
            totalCompleted,
            completionRate
        };
    }
    
    renderWaterfallChart(canvasId, data, orderSetId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        // Create waterfall effect using stacked bars
        // We'll show: started (base), answered (positive), dropped (negative)
        const datasets = [
            {
                label: 'Answered (Continuing)',
                data: data.answered,
                backgroundColor: 'rgba(74, 222, 128, 0.8)',
                borderColor: 'rgba(74, 222, 128, 1)',
                borderWidth: 2,
                borderRadius: 4
            },
            {
                label: 'Dropped',
                data: data.dropped.map(d => -d), // Negative to show drop
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                borderRadius: 4
            }
        ];
        
        // Calculate cumulative positions for waterfall
        const cumulativeData = [];
        let currentLevel = 0;
        
        data.labels.forEach((label, index) => {
            const answered = data.answered[index] || 0;
            const dropped = data.dropped[index] || 0;
            
            cumulativeData.push({
                start: currentLevel,
                answered: answered,
                dropped: dropped,
                end: currentLevel + answered - dropped
            });
            
            currentLevel = currentLevel + answered - dropped;
        });
        
        // Create custom waterfall visualization
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Answered',
                        data: data.answered,
                        backgroundColor: 'rgba(74, 222, 128, 0.9)',
                        borderColor: 'rgba(74, 222, 128, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        barThickness: 40
                    },
                    {
                        label: 'Dropped',
                        data: data.dropped.map(d => -d),
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        barThickness: 40
                    }
                ]
            },
            options: {
                indexAxis: 'x',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Poppins', size: 12 },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = Math.abs(context.parsed.y);
                                const label = context.dataset.label;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Poppins', size: 12, weight: '600' }
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: false,
                        grid: { 
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { family: 'Poppins', size: 11 },
                            callback: function(value) {
                                return Math.abs(value);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Users',
                            font: { family: 'Poppins', size: 13, weight: '600' }
                        }
                    }
                }
            }
        });
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
        const container = document.querySelector('.dashboard-main');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="nav-btn" style="margin-top: 2rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});
