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
        
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
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
            this.renderDropoffChart(dropoffs, questions, stats);
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
    
    renderDropoffChart(dropoffs, questions, stats) {
        const ctx = document.getElementById('dropoffChart');
        if (!ctx) return;
        
        const ctx2d = ctx.getContext('2d');
        
        if (this.charts.dropoff) {
            this.charts.dropoff.destroy();
        }
        
        if (!dropoffs || dropoffs.length === 0) {
            // Show a message if no drop-off data
            return;
        }
        
        // Create a funnel-style visualization showing drop-off points
        // Group drop-offs by question index to show total drop-offs per question
        const dropoffByQuestion = {};
        dropoffs.forEach(stat => {
            const qIndex = stat.questionIndex || 0;
            if (!dropoffByQuestion[qIndex]) {
                dropoffByQuestion[qIndex] = {
                    questionIndex: qIndex,
                    questionId: stat.questionId,
                    dropoffCount: 0,
                    totalCompletion: 0,
                    count: 0
                };
            }
            dropoffByQuestion[qIndex].dropoffCount += stat.dropoffCount || 0;
            dropoffByQuestion[qIndex].totalCompletion += (stat.avgCompletionAtDropoff || 0) * (stat.dropoffCount || 0);
            dropoffByQuestion[qIndex].count += stat.dropoffCount || 0;
        });
        
        // Calculate average completion for each question
        Object.keys(dropoffByQuestion).forEach(key => {
            const item = dropoffByQuestion[key];
            item.avgCompletion = item.count > 0 ? item.totalCompletion / item.count : 0;
        });
        
        // Sort by question index
        const sortedDropoffs = Object.values(dropoffByQuestion)
            .sort((a, b) => a.questionIndex - b.questionIndex);
        
        if (sortedDropoffs.length === 0) {
            return;
        }
        
        const labels = sortedDropoffs.map(d => `Q${d.questionIndex + 1}`);
        const dropoffCounts = sortedDropoffs.map(d => d.dropoffCount);
        
        this.charts.dropoff = new Chart(ctx2d, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Drop-offs',
                    data: dropoffCounts,
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        padding: 12,
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                const item = sortedDropoffs[index];
                                return `Question ${item.questionIndex + 1}`;
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const item = sortedDropoffs[index];
                                return [
                                    `Drop-offs: ${item.dropoffCount}`,
                                    `Avg completion: ${item.avgCompletion.toFixed(1)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Poppins', size: 12, weight: '600' }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { family: 'Poppins', size: 11 },
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Number of Drop-offs',
                            font: { family: 'Poppins', size: 13, weight: '600' }
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
        
        // Clear container and create funnel for each order set
        container.innerHTML = '';
        
        Object.keys(grouped).forEach((orderSetId, setIndex) => {
            const questionList = grouped[orderSetId].sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
            
            // Calculate funnel data
            const funnelData = this.calculateFunnelData(questionList);
            
            // Create collapsible funnel card
            const funnelCard = document.createElement('div');
            funnelCard.className = 'funnel-card';
            funnelCard.innerHTML = `
                <div class="funnel-header" onclick="this.closest('.funnel-card').classList.toggle('funnel-card--collapsed')">
                    <div class="funnel-header__left">
                        <h3>Order Set: ${orderSetId}</h3>
                        <div class="funnel-header__stats">
                            <span class="funnel-stat-badge">
                                <span class="funnel-stat-badge__value">${funnelData.totalStarted}</span>
                                <span class="funnel-stat-badge__label">Started</span>
                            </span>
                            <span class="funnel-stat-badge">
                                <span class="funnel-stat-badge__value">${funnelData.totalCompleted}</span>
                                <span class="funnel-stat-badge__label">Completed</span>
                            </span>
                            <span class="funnel-stat-badge funnel-stat-badge--rate">
                                <span class="funnel-stat-badge__value">${funnelData.completionRate.toFixed(1)}%</span>
                                <span class="funnel-stat-badge__label">Completion</span>
                            </span>
                        </div>
                    </div>
                    <button class="funnel-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="funnel-content">
                    <div class="funnel-visualization">
                        <div class="funnel-chart-wrapper">
                            <canvas id="funnelChart_${setIndex}"></canvas>
                        </div>
                        <div class="funnel-dropoffs" id="funnelDropoffs_${setIndex}">
                            <!-- Drop-off percentages will be rendered here -->
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(funnelCard);
            
            // Render funnel chart
            setTimeout(() => {
                this.renderFunnelChart(`funnelChart_${setIndex}`, funnelData, orderSetId);
                this.renderFunnelDropoffs(`funnelDropoffs_${setIndex}`, funnelData);
            }, 100);
        });
    }
    
    calculateFunnelData(questionList) {
        // Sort by question index
        const sorted = [...questionList].sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
        
        if (sorted.length === 0) {
            return {
                steps: [],
                totalStarted: 0,
                totalCompleted: 0,
                completionRate: 0
            };
        }
        
        const steps = [];
        const initialUsers = sorted[0].startedCount || 0;
        
        // Add start step
        steps.push({
            label: 'Start',
            users: initialUsers,
            dropoff: 0,
            dropoffPercent: 0
        });
        
        // Calculate flow through each question
        let previousUsers = initialUsers;
        
        sorted.forEach((q, index) => {
            const startedCount = q.startedCount || 0;
            const answeredCount = q.answeredCount || 0;
            const droppedCount = startedCount - answeredCount;
            
            // Users reaching this question (should match previous answered count)
            const usersReaching = index === 0 ? startedCount : previousUsers;
            
            // Users continuing to next question
            const usersContinuing = answeredCount;
            
            // Drop-off between previous step and this step
            const dropoff = usersReaching - usersContinuing;
            const dropoffPercent = usersReaching > 0 ? (dropoff / usersReaching * 100) : 0;
            
            steps.push({
                label: `Q${(q.questionIndex || index) + 1}`,
                questionId: q.questionId,
                users: usersContinuing,
                dropoff: dropoff,
                dropoffPercent: dropoffPercent,
                usersReaching: usersReaching
            });
            
            previousUsers = usersContinuing;
        });
        
        // Calculate totals
        const totalStarted = initialUsers;
        const totalCompleted = steps[steps.length - 1]?.users || 0;
        const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted * 100) : 0;
        
        return {
            steps,
            totalStarted,
            totalCompleted,
            completionRate
        };
    }
    
    renderFunnelDropoffs(containerId, funnelData) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const dropoffItems = [];
        
        // Create drop-off analysis for ALL transitions between steps
        for (let i = 1; i < funnelData.steps.length; i++) {
            const currentStep = funnelData.steps[i];
            const previousStep = funnelData.steps[i - 1];
            
            // Show all transitions, even if dropoff is 0
            dropoffItems.push({
                from: previousStep.label,
                to: currentStep.label,
                fromUsers: previousStep.users,
                toUsers: currentStep.users,
                dropoff: currentStep.dropoff || 0,
                dropoffPercent: currentStep.dropoffPercent || 0
            });
        }
        
        if (dropoffItems.length === 0) {
            container.innerHTML = '<div class="no-dropoffs">No transition data available</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="funnel-dropoffs-header">
                <h4>Drop-off Analysis</h4>
                <p class="funnel-dropoffs-subtitle">Percentage of users leaving at each step</p>
            </div>
            <div class="funnel-dropoffs-list">
                ${dropoffItems.map(item => {
                    const hasDropoff = item.dropoffPercent > 0;
                    const severityClass = item.dropoffPercent > 50 ? 'funnel-dropoff-item__percent--high' : 
                                        item.dropoffPercent > 20 ? 'funnel-dropoff-item__percent--medium' : 
                                        item.dropoffPercent > 0 ? 'funnel-dropoff-item__percent--low' : '';
                    const borderClass = hasDropoff ? 'funnel-dropoff-item--has-dropoff' : 'funnel-dropoff-item--no-dropoff';
                    
                    return `
                        <div class="funnel-dropoff-item ${borderClass}">
                            <div class="funnel-dropoff-item__transition">
                                <span class="funnel-dropoff-item__from">${item.from}</span>
                                <i class="fas fa-arrow-right"></i>
                                <span class="funnel-dropoff-item__to">${item.to}</span>
                            </div>
                            <div class="funnel-dropoff-item__stats">
                                <span class="funnel-dropoff-item__users">${item.fromUsers} → ${item.toUsers} users</span>
                                <span class="funnel-dropoff-item__percent ${severityClass}">
                                    ${item.dropoffPercent > 0 ? `${item.dropoffPercent.toFixed(1)}% drop-off` : '0.0% drop-off'}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    renderFunnelChart(canvasId, funnelData, orderSetId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        if (!funnelData.steps || funnelData.steps.length === 0) {
            return;
        }
        
        // Extract data for chart
        const labels = funnelData.steps.map(s => s.label);
        const userCounts = funnelData.steps.map(s => s.users);
        
        // Create funnel-style bar chart (decreasing bars)
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Users',
                    data: userCounts,
                    backgroundColor: function(context) {
                        const index = context.dataIndex;
                        // Gradient from blue to green as users progress
                        if (index === 0) {
                            return 'rgba(2, 115, 197, 0.9)'; // Start - blue
                        } else if (index === userCounts.length - 1) {
                            return 'rgba(74, 222, 128, 0.9)'; // End - green
                        } else {
                            return 'rgba(234, 195, 68, 0.9)'; // Middle - yellow
                        }
                    },
                    borderColor: function(context) {
                        const index = context.dataIndex;
                        if (index === 0) {
                            return 'rgba(2, 115, 197, 1)';
                        } else if (index === userCounts.length - 1) {
                            return 'rgba(74, 222, 128, 1)';
                        } else {
                            return 'rgba(234, 195, 68, 1)';
                        }
                    },
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 60
                }]
            },
            options: {
                indexAxis: 'x',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        padding: 14,
                        titleFont: { family: 'Poppins', size: 14, weight: '600' },
                        bodyFont: { family: 'Poppins', size: 13 },
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const step = funnelData.steps[index];
                                const prevStep = index > 0 ? funnelData.steps[index - 1] : null;
                                
                                const tooltip = [`Users: ${step.users}`];
                                
                                if (prevStep && step.dropoff > 0) {
                                    tooltip.push(`Drop-off: ${step.dropoff} (${step.dropoffPercent.toFixed(1)}%)`);
                                }
                                
                                return tooltip;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Poppins', size: 12, weight: '600' }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { family: 'Poppins', size: 11 },
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Number of Users',
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
    
    async clearAllData() {
        // Show confirmation dialog
        const confirmed = confirm(
            '⚠️ WARNING: This will permanently delete ALL analytics data!\n\n' +
            'This includes:\n' +
            '• All chat sessions\n' +
            '• All question events\n' +
            '• All drop-off points\n\n' +
            'This action cannot be undone!\n\n' +
            'Are you sure you want to continue?'
        );
        
        if (!confirmed) {
            return;
        }
        
        // Double confirmation
        const doubleConfirmed = confirm(
            'Are you absolutely sure? This will delete ALL analytics data permanently!'
        );
        
        if (!doubleConfirmed) {
            return;
        }
        
        this.showLoading();
        
        try {
            const url = `${this.dashboardApiUrl}/clear-data`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            // Show success message
            alert('✅ Success! All analytics data has been cleared.');
            
            // Reload dashboard data
            this.loadDashboardData();
            
        } catch (error) {
            console.error('Error clearing data:', error);
            alert(`❌ Failed to clear data: ${error.message}`);
        } finally {
            this.hideLoading();
        }
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
