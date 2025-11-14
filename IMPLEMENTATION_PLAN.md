# Modular Question System with Analytics Dashboard
## Implementation Plan

### Overview
Transform the chat system into a modular question-based flow with:
- Predefined questions that can be asked in different orders
- Multiple order set configurations
- Random selection of order set per visitor
- Comprehensive analytics tracking
- Visual dashboard for insights

---

## Phase 1: Core Architecture & Data Structure

### 1.1 Question Configuration System

**File: `questions.config.js`**
```javascript
// Question definitions
const QUESTIONS = {
    1: {
        id: 1,
        text: "What is your approximate tax debt amount?",
        type: "amount", // amount, text, yesno, multiple_choice
        required: true,
        validation: {
            type: "number",
            min: 0
        },
        followUp: {
            condition: "> 10000",
            message: "We specialize in cases over $10,000. Let me help you explore your options."
        }
    },
    2: {
        id: 2,
        text: "How long have you been dealing with this tax debt?",
        type: "multiple_choice",
        options: [
            "Less than 1 year",
            "1-3 years",
            "3-5 years",
            "More than 5 years"
        ],
        required: true
    },
    3: {
        id: 3,
        text: "Have you received any notices from the IRS?",
        type: "yesno",
        required: true
    },
    4: {
        id: 4,
        text: "What is your current employment status?",
        type: "multiple_choice",
        options: [
            "Employed full-time",
            "Employed part-time",
            "Self-employed",
            "Unemployed",
            "Retired"
        ],
        required: true
    },
    5: {
        id: 5,
        text: "What is your monthly household income?",
        type: "amount",
        required: true,
        validation: {
            type: "number",
            min: 0
        }
    },
    6: {
        id: 6,
        text: "Do you own any assets (home, car, savings)?",
        type: "yesno",
        required: true
    },
    7: {
        id: 7,
        text: "What is your primary concern about your tax situation?",
        type: "text",
        required: true,
        maxLength: 500
    },
    8: {
        id: 8,
        text: "Would you like to schedule a free consultation?",
        type: "yesno",
        required: true
    }
};

// Order set configurations
const ORDER_SETS = [
    {
        id: "set_1",
        name: "Standard Flow",
        order: [1, 2, 3, 4, 5, 6, 7, 8],
        description: "Traditional question flow"
    },
    {
        id: "set_2",
        name: "Debt-First Approach",
        order: [2, 1, 3, 5, 6, 4, 7, 8],
        description: "Focus on debt duration first"
    },
    {
        id: "set_3",
        name: "Financial-First Approach",
        order: [3, 1, 2, 5, 6, 4, 7, 8],
        description: "Start with IRS notices and financial situation"
    },
    {
        id: "set_4",
        name: "Asset-First Approach",
        order: [6, 4, 7, 2, 1, 5, 3, 8],
        description: "Prioritize asset and employment questions"
    }
];

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QUESTIONS, ORDER_SETS };
}
```

---

## Phase 2: Chat Flow Engine

### 2.1 Enhanced Chat Class Structure

**File: `chat.js` - Enhanced**

```javascript
class TaxReliefChat {
    constructor() {
        // ... existing properties ...
        
        // Question flow properties
        this.currentOrderSet = null;
        this.currentQuestionIndex = 0;
        this.questionAnswers = {};
        this.questionFlow = [];
        this.isInQuestionFlow = false;
        this.questionStartTime = null;
        
        // Load question configuration
        this.loadQuestionConfig();
        
        // Initialize with random order set
        this.initializeQuestionFlow();
    }
    
    loadQuestionConfig() {
        // Load from config file or API
        this.questions = window.QUESTIONS || QUESTIONS;
        this.orderSets = window.ORDER_SETS || ORDER_SETS;
    }
    
    initializeQuestionFlow() {
        // Randomly select an order set
        const randomIndex = Math.floor(Math.random() * this.orderSets.length);
        this.currentOrderSet = this.orderSets[randomIndex];
        
        // Build question flow array
        this.questionFlow = this.currentOrderSet.order.map(qId => ({
            questionId: qId,
            question: this.questions[qId],
            answered: false,
            answer: null,
            timestamp: null,
            timeToAnswer: null
        }));
        
        // Track order set selection
        this.trackOrderSetSelection();
    }
    
    trackOrderSetSelection() {
        // Send to analytics API
        this.sendAnalyticsEvent('order_set_selected', {
            orderSetId: this.currentOrderSet.id,
            orderSetName: this.currentOrderSet.name,
            questionOrder: this.currentOrderSet.order
        });
    }
    
    startQuestionFlow() {
        this.isInQuestionFlow = true;
        this.questionStartTime = Date.now();
        this.askNextQuestion();
    }
    
    askNextQuestion() {
        if (this.currentQuestionIndex >= this.questionFlow.length) {
            this.completeQuestionFlow();
            return;
        }
        
        const currentQuestion = this.questionFlow[this.currentQuestionIndex];
        const questionData = currentQuestion.question;
        
        // Track question start
        this.trackQuestionStart(currentQuestion.questionId);
        
        // Format question based on type
        let questionText = questionData.text;
        
        // Add question to chat
        this.addAgentMessage(questionText);
        
        // Show appropriate input UI based on question type
        this.showQuestionInput(questionData);
    }
    
    showQuestionInput(questionData) {
        const inputArea = document.querySelector('.chat-window__input-area');
        const inputWrapper = document.querySelector('.chat-input-wrapper');
        
        // Clear existing input
        this.chatInput.value = '';
        
        // Show appropriate input based on question type
        switch(questionData.type) {
            case 'yesno':
                this.showYesNoButtons(inputWrapper);
                break;
            case 'multiple_choice':
                this.showMultipleChoiceButtons(questionData.options, inputWrapper);
                break;
            case 'amount':
                this.chatInput.type = 'number';
                this.chatInput.placeholder = 'Enter amount (e.g., 5000)';
                break;
            case 'text':
                this.chatInput.type = 'text';
                this.chatInput.placeholder = 'Type your answer...';
                break;
        }
    }
    
    showYesNoButtons(container) {
        // Create yes/no buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'question-buttons';
        buttonContainer.innerHTML = `
            <button class="question-btn question-btn--yes" data-answer="yes">Yes</button>
            <button class="question-btn question-btn--no" data-answer="no">No</button>
        `;
        
        // Replace input temporarily
        const input = container.querySelector('.chat-input');
        input.style.display = 'none';
        container.appendChild(buttonContainer);
        
        // Add event listeners
        buttonContainer.querySelectorAll('.question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAnswer(e.target.dataset.answer);
                buttonContainer.remove();
                input.style.display = 'block';
            });
        });
    }
    
    showMultipleChoiceButtons(options, container) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'question-buttons question-buttons--multiple';
        
        const buttonsHTML = options.map((option, index) => 
            `<button class="question-btn" data-answer="${option}">${option}</button>`
        ).join('');
        
        buttonContainer.innerHTML = buttonsHTML;
        
        const input = container.querySelector('.chat-input');
        input.style.display = 'none';
        container.appendChild(buttonContainer);
        
        buttonContainer.querySelectorAll('.question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAnswer(e.target.dataset.answer);
                buttonContainer.remove();
                input.style.display = 'block';
            });
        });
    }
    
    handleAnswer(answer) {
        const currentQuestion = this.questionFlow[this.currentQuestionIndex];
        const questionStartTime = currentQuestion.timestamp || Date.now();
        
        // Validate answer
        if (!this.validateAnswer(answer, currentQuestion.question)) {
            this.addAgentMessage("I didn't understand that. Could you please try again?");
            return;
        }
        
        // Store answer
        currentQuestion.answered = true;
        currentQuestion.answer = answer;
        currentQuestion.timestamp = Date.now();
        currentQuestion.timeToAnswer = currentQuestion.timestamp - questionStartTime;
        
        // Add user message
        this.addUserMessage(answer);
        
        // Track answer
        this.trackQuestionAnswer(
            currentQuestion.questionId,
            answer,
            currentQuestion.timeToAnswer
        );
        
        // Move to next question
        this.currentQuestionIndex++;
        
        // Small delay before next question
        setTimeout(() => {
            this.askNextQuestion();
        }, 1000);
    }
    
    validateAnswer(answer, question) {
        if (question.required && !answer) return false;
        
        switch(question.type) {
            case 'amount':
                const num = parseFloat(answer);
                if (isNaN(num)) return false;
                if (question.validation && question.validation.min !== undefined) {
                    return num >= question.validation.min;
                }
                return true;
            case 'yesno':
                return ['yes', 'no', 'y', 'n'].includes(answer.toLowerCase());
            case 'multiple_choice':
                return question.options.includes(answer);
            default:
                return answer && answer.trim().length > 0;
        }
    }
    
    completeQuestionFlow() {
        this.isInQuestionFlow = false;
        const completionTime = Date.now() - this.questionStartTime;
        
        // Calculate completion percentage
        const answeredCount = this.questionFlow.filter(q => q.answered).length;
        const completionPercentage = (answeredCount / this.questionFlow.length) * 100;
        
        // Track completion
        this.trackQuestionFlowCompletion(completionPercentage, completionTime);
        
        // Transition to normal chat or thank you message
        this.addAgentMessage("Thank you for providing that information! Let me connect you with one of our tax experts who can help you further.");
        
        // Send complete data to API
        this.sendQuestionFlowData();
    }
    
    trackQuestionStart(questionId) {
        this.sendAnalyticsEvent('question_started', {
            orderSetId: this.currentOrderSet.id,
            questionId: questionId,
            questionIndex: this.currentQuestionIndex,
            timestamp: Date.now()
        });
    }
    
    trackQuestionAnswer(questionId, answer, timeToAnswer) {
        this.sendAnalyticsEvent('question_answered', {
            orderSetId: this.currentOrderSet.id,
            questionId: questionId,
            questionIndex: this.currentQuestionIndex,
            answer: answer,
            timeToAnswer: timeToAnswer,
            timestamp: Date.now()
        });
    }
    
    trackQuestionFlowCompletion(completionPercentage, totalTime) {
        this.sendAnalyticsEvent('question_flow_completed', {
            orderSetId: this.currentOrderSet.id,
            completionPercentage: completionPercentage,
            totalTime: totalTime,
            questionsAnswered: this.questionFlow.filter(q => q.answered).length,
            totalQuestions: this.questionFlow.length,
            timestamp: Date.now()
        });
    }
    
    sendQuestionFlowData() {
        const flowData = {
            sessionId: this.conversationData.sessionId,
            orderSetId: this.currentOrderSet.id,
            orderSetName: this.currentOrderSet.name,
            questionOrder: this.currentOrderSet.order,
            questions: this.questionFlow.map(q => ({
                questionId: q.questionId,
                answered: q.answered,
                answer: q.answer,
                timestamp: q.timestamp,
                timeToAnswer: q.timeToAnswer
            })),
            completionPercentage: (this.questionFlow.filter(q => q.answered).length / this.questionFlow.length) * 100,
            totalTime: Date.now() - this.questionStartTime,
            userInfo: this.conversationData.userInfo
        };
        
        // Send to analytics API
        this.sendAnalyticsEvent('question_flow_data', flowData);
    }
    
    sendAnalyticsEvent(eventType, data) {
        // Send to analytics endpoint
        if (this.apiConfig.enabled && window.ANALYTICS_ENDPOINT) {
            fetch(window.ANALYTICS_ENDPOINT || this.apiConfig.endpoint.replace('/submit', '/analytics'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: eventType,
                    sessionId: this.conversationData.sessionId,
                    timestamp: new Date().toISOString(),
                    data: data
                })
            }).catch(err => console.error('Analytics error:', err));
        }
        
        // Also store locally for dashboard
        this.storeAnalyticsLocally(eventType, data);
    }
    
    storeAnalyticsLocally(eventType, data) {
        try {
            const analytics = JSON.parse(localStorage.getItem('chatAnalytics') || '[]');
            analytics.push({
                eventType,
                timestamp: Date.now(),
                data
            });
            // Keep last 1000 events
            if (analytics.length > 1000) {
                analytics.shift();
            }
            localStorage.setItem('chatAnalytics', JSON.stringify(analytics));
        } catch (e) {
            console.error('Error storing analytics:', e);
        }
    }
}
```

---

## Phase 3: Analytics API & Backend

### 3.1 Analytics Data Structure

**Database Schema (Example - PostgreSQL)**
```sql
-- Order Set Configurations
CREATE TABLE order_sets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    question_order INTEGER[],
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Question Definitions
CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    type VARCHAR(50),
    options JSONB,
    validation JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE chat_sessions (
    id VARCHAR(255) PRIMARY KEY,
    order_set_id VARCHAR(50) REFERENCES order_sets(id),
    user_info JSONB,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    completion_percentage DECIMAL(5,2),
    total_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Question Events
CREATE TABLE question_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES chat_sessions(id),
    order_set_id VARCHAR(50),
    question_id INTEGER,
    question_index INTEGER,
    event_type VARCHAR(50), -- 'started', 'answered', 'skipped'
    answer TEXT,
    time_to_answer_ms INTEGER,
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Drop-off Points
CREATE TABLE dropoff_points (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES chat_sessions(id),
    order_set_id VARCHAR(50),
    question_id INTEGER,
    question_index INTEGER,
    completion_at_dropoff DECIMAL(5,2),
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 API Endpoints

**File: `api/analytics.js` (Node.js/Express example)**
```javascript
// POST /api/analytics/event
app.post('/api/analytics/event', async (req, res) => {
    const { eventType, sessionId, timestamp, data } = req.body;
    
    try {
        switch(eventType) {
            case 'order_set_selected':
                await db.query(
                    'INSERT INTO chat_sessions (id, order_set_id, user_info, start_time) VALUES ($1, $2, $3, $4)',
                    [sessionId, data.orderSetId, data.userInfo, new Date(timestamp)]
                );
                break;
                
            case 'question_started':
                await db.query(
                    'INSERT INTO question_events (session_id, order_set_id, question_id, question_index, event_type, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
                    [sessionId, data.orderSetId, data.questionId, data.questionIndex, 'started', new Date(timestamp)]
                );
                break;
                
            case 'question_answered':
                await db.query(
                    'INSERT INTO question_events (session_id, order_set_id, question_id, question_index, event_type, answer, time_to_answer_ms, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [sessionId, data.orderSetId, data.questionId, data.questionIndex, 'answered', data.answer, data.timeToAnswer, new Date(timestamp)]
                );
                break;
                
            case 'question_flow_completed':
                await db.query(
                    'UPDATE chat_sessions SET end_time = $1, completion_percentage = $2, total_time_ms = $3 WHERE id = $4',
                    [new Date(timestamp), data.completionPercentage, data.totalTime, sessionId]
                );
                break;
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to record analytics' });
    }
});

// GET /api/analytics/dashboard
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        // Get order set performance
        const orderSetStats = await db.query(`
            SELECT 
                os.id,
                os.name,
                COUNT(DISTINCT cs.id) as total_sessions,
                AVG(cs.completion_percentage) as avg_completion,
                COUNT(DISTINCT CASE WHEN cs.completion_percentage >= 90 THEN cs.id END) as high_completion_count,
                COUNT(DISTINCT CASE WHEN cs.completion_percentage >= 50 AND cs.completion_percentage < 90 THEN cs.id END) as medium_completion_count,
                COUNT(DISTINCT CASE WHEN cs.completion_percentage < 50 THEN cs.id END) as low_completion_count
            FROM order_sets os
            LEFT JOIN chat_sessions cs ON os.id = cs.order_set_id
            WHERE os.active = TRUE
            GROUP BY os.id, os.name
        `);
        
        // Get drop-off points
        const dropoffStats = await db.query(`
            SELECT 
                order_set_id,
                question_id,
                question_index,
                COUNT(*) as dropoff_count,
                AVG(completion_at_dropoff) as avg_completion_at_dropoff
            FROM dropoff_points
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY order_set_id, question_id, question_index
            ORDER BY dropoff_count DESC
        `);
        
        // Get question performance
        const questionStats = await db.query(`
            SELECT 
                qe.order_set_id,
                qe.question_id,
                qe.question_index,
                COUNT(CASE WHEN qe.event_type = 'started' THEN 1 END) as started_count,
                COUNT(CASE WHEN qe.event_type = 'answered' THEN 1 END) as answered_count,
                AVG(CASE WHEN qe.time_to_answer_ms IS NOT NULL THEN qe.time_to_answer_ms END) as avg_time_to_answer
            FROM question_events qe
            WHERE qe.timestamp >= NOW() - INTERVAL '30 days'
            GROUP BY qe.order_set_id, qe.question_id, qe.question_index
        `);
        
        res.json({
            orderSetStats: orderSetStats.rows,
            dropoffStats: dropoffStats.rows,
            questionStats: questionStats.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## Phase 4: Analytics Dashboard

### 4.1 Dashboard HTML Structure

**File: `analytics.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Analytics Dashboard</title>
    <link rel="stylesheet" href="libs/fonts/poppins/poppins.css">
    <link rel="stylesheet" href="libs/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <h1>Chat Analytics Dashboard</h1>
            <div class="dashboard-controls">
                <select id="timeRange" class="time-range-select">
                    <option value="7">Last 7 days</option>
                    <option value="30" selected>Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
                <button id="refreshBtn" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </header>
        
        <div class="dashboard-content">
            <!-- Order Set Performance -->
            <section class="dashboard-section">
                <h2>Order Set Performance</h2>
                <div class="stats-grid">
                    <div class="stat-card" id="orderSetStats">
                        <!-- Dynamically populated -->
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="orderSetChart"></canvas>
                </div>
            </section>
            
            <!-- Completion Rate Analysis -->
            <section class="dashboard-section">
                <h2>Completion Rate Analysis</h2>
                <div class="chart-container">
                    <canvas id="completionChart"></canvas>
                </div>
            </section>
            
            <!-- Drop-off Analysis -->
            <section class="dashboard-section">
                <h2>Drop-off Points</h2>
                <div class="chart-container">
                    <canvas id="dropoffChart"></canvas>
                </div>
                <div id="dropoffTable" class="data-table">
                    <!-- Dynamically populated -->
                </div>
            </section>
            
            <!-- Question Performance -->
            <section class="dashboard-section">
                <h2>Question Performance by Order Set</h2>
                <div id="questionPerformance" class="question-performance-grid">
                    <!-- Dynamically populated -->
                </div>
            </section>
        </div>
    </div>
    
    <script src="dashboard.js"></script>
</body>
</html>
```

### 4.2 Dashboard JavaScript

**File: `dashboard.js`**
```javascript
class AnalyticsDashboard {
    constructor() {
        this.apiEndpoint = window.ANALYTICS_API_ENDPOINT || '/api/analytics/dashboard';
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
    
    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiEndpoint}?days=${this.timeRange}`);
            const data = await response.json();
            
            this.renderOrderSetStats(data.orderSetStats);
            this.renderCompletionChart(data.orderSetStats);
            this.renderDropoffChart(data.dropoffStats);
            this.renderQuestionPerformance(data.questionStats);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    renderOrderSetStats(stats) {
        const container = document.getElementById('orderSetStats');
        container.innerHTML = stats.map(set => `
            <div class="stat-card">
                <h3>${set.name}</h3>
                <div class="stat-value">${set.total_sessions || 0}</div>
                <div class="stat-label">Total Sessions</div>
                <div class="stat-value stat-value--percentage">${(set.avg_completion || 0).toFixed(1)}%</div>
                <div class="stat-label">Avg Completion</div>
                <div class="completion-breakdown">
                    <div class="completion-bar completion-bar--high" style="width: ${(set.high_completion_count / set.total_sessions * 100) || 0}%"></div>
                    <div class="completion-bar completion-bar--medium" style="width: ${(set.medium_completion_count / set.total_sessions * 100) || 0}%"></div>
                    <div class="completion-bar completion-bar--low" style="width: ${(set.low_completion_count / set.total_sessions * 100) || 0}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    renderCompletionChart(stats) {
        const ctx = document.getElementById('completionChart').getContext('2d');
        
        if (this.charts.completion) {
            this.charts.completion.destroy();
        }
        
        this.charts.completion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.map(s => s.name),
                datasets: [{
                    label: 'Average Completion %',
                    data: stats.map(s => parseFloat(s.avg_completion || 0)),
                    backgroundColor: 'rgba(2, 115, 197, 0.8)',
                    borderColor: 'rgba(2, 115, 197, 1)',
                    borderWidth: 1
                }, {
                    label: 'High Completion (≥90%)',
                    data: stats.map(s => (s.high_completion_count / s.total_sessions * 100) || 0),
                    backgroundColor: 'rgba(74, 222, 128, 0.8)',
                    borderColor: 'rgba(74, 222, 128, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    renderDropoffChart(dropoffStats) {
        // Group by order set
        const grouped = {};
        dropoffStats.forEach(stat => {
            if (!grouped[stat.order_set_id]) {
                grouped[stat.order_set_id] = [];
            }
            grouped[stat.order_set_id].push(stat);
        });
        
        const ctx = document.getElementById('dropoffChart').getContext('2d');
        
        if (this.charts.dropoff) {
            this.charts.dropoff.destroy();
        }
        
        // Create line chart showing drop-off at each question
        const datasets = Object.keys(grouped).map((orderSetId, index) => {
            const data = grouped[orderSetId].sort((a, b) => a.question_index - b.question_index);
            return {
                label: `Order Set ${orderSetId}`,
                data: data.map(d => ({
                    x: d.question_index,
                    y: d.dropoff_count
                })),
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                tension: 0.4
            };
        });
        
        this.charts.dropoff = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
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
    
    renderQuestionPerformance(questionStats) {
        // Group by order set and question
        const container = document.getElementById('questionPerformance');
        // Implementation for question performance visualization
    }
    
    getColor(index, alpha = 1) {
        const colors = [
            `rgba(2, 115, 197, ${alpha})`,
            `rgba(234, 195, 68, ${alpha})`,
            `rgba(74, 222, 128, ${alpha})`,
            `rgba(239, 68, 68, ${alpha})`
        ];
        return colors[index % colors.length];
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});
```

---

## Phase 5: CSS Styling for Dashboard

**File: `dashboard.css`**
```css
/* Dashboard-specific styles matching the site design */
.dashboard-container {
    max-width: 140rem;
    margin: 0 auto;
    padding: 2rem;
    font-family: Poppins, sans-serif;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid var(--bg-light);
}

.dashboard-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.stat-card {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-container {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    margin-top: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

---

## Phase 6: Configuration Management

### 6.1 Admin Interface for Order Sets

**File: `admin.html`** (Optional - for managing order sets)
- UI to create/edit order sets
- Drag-and-drop question reordering
- Preview functionality
- Enable/disable order sets

---

## Implementation Checklist

### Phase 1: Core Setup
- [ ] Create `questions.config.js` with question definitions
- [ ] Create order set configurations
- [ ] Update `chat.js` to load question config

### Phase 2: Question Flow Engine
- [ ] Implement `initializeQuestionFlow()` method
- [ ] Implement `askNextQuestion()` method
- [ ] Create input UI components for different question types
- [ ] Implement answer validation
- [ ] Add question flow tracking

### Phase 3: Analytics Backend
- [ ] Set up database schema
- [ ] Create analytics API endpoints
- [ ] Implement event tracking
- [ ] Set up data aggregation queries

### Phase 4: Dashboard
- [ ] Create `analytics.html` page
- [ ] Implement dashboard JavaScript
- [ ] Create Chart.js visualizations
- [ ] Add CSS styling
- [ ] Implement data refresh functionality

### Phase 5: Integration
- [ ] Connect chat to analytics API
- [ ] Test question flow end-to-end
- [ ] Verify analytics data collection
- [ ] Test dashboard data display

### Phase 6: Testing & Optimization
- [ ] Test all question types
- [ ] Test all order sets
- [ ] Verify analytics accuracy
- [ ] Performance optimization
- [ ] Mobile responsiveness for dashboard

---

## Key Metrics to Track

1. **Order Set Performance**
   - Total sessions per order set
   - Average completion percentage
   - High completion rate (≥90%)
   - Medium completion rate (50-89%)
   - Low completion rate (<50%)

2. **Drop-off Analysis**
   - Which question causes most drop-offs
   - Completion percentage at drop-off point
   - Time spent before drop-off

3. **Question Performance**
   - Answer rate per question
   - Average time to answer
   - Skip rate (if applicable)

4. **User Behavior**
   - Session duration
   - Questions answered per session
   - Most common answer paths

---

## Next Steps

1. Review and approve this implementation plan
2. Set up development environment
3. Begin with Phase 1 (Core Setup)
4. Iterate through phases sequentially
5. Test each phase before moving to next

Would you like me to start implementing any specific phase, or would you prefer to review/modify the plan first?

