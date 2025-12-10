// ============================================
// DASHBOARD SERVICE
// Provides aggregated analytics data for dashboard
// ============================================

const db = require('../db/database');

class DashboardService {
    // Helper to calculate the "since" date
    // When days=1, use start of today (midnight) instead of "1 day ago"
    getSinceDate(days) {
        const sinceDate = new Date();
        if (days === 1) {
            // For "Today", set to start of today (midnight)
            sinceDate.setHours(0, 0, 0, 0);
        } else {
            // For other periods, subtract days
            sinceDate.setDate(sinceDate.getDate() - days);
        }
        return sinceDate;
    }
    
    async getDashboardStats(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        const [sessions, events, completionData] = await Promise.all([
            db.query(
                `SELECT COUNT(*) as total, 
                        AVG(total_time_ms) as avg_time
                 FROM chat_sessions 
                 WHERE created_at >= ?`,
                [sinceDate]
            ),
            db.query(
                `SELECT COUNT(*) as total FROM question_events 
                 WHERE created_at >= ?`,
                [sinceDate]
            ),
            // Calculate completion percentage dynamically from question_events
            // Count answered questions per session
            db.query(
                `SELECT 
                    cs.id as session_id,
                    cs.order_set_id,
                    COUNT(DISTINCT CASE WHEN qe.event_type = 'answered' THEN qe.question_id END) as questions_answered
                FROM chat_sessions cs
                LEFT JOIN question_events qe ON cs.id = qe.session_id AND qe.created_at >= ?
                WHERE cs.created_at >= ?
                GROUP BY cs.id, cs.order_set_id`,
                [sinceDate, sinceDate]
            )
        ]);
        
        // Calculate average completion from dynamic data
        // Get order set question counts to calculate accurate completion percentages
        let avgCompletion = 0;
        if (completionData.rows.length > 0) {
            // Get order set question counts
            const orderSetIds = [...new Set(completionData.rows.map(r => r.order_set_id).filter(Boolean))];
            const orderSetCounts = {};
            
            if (orderSetIds.length > 0) {
                // Build query with proper placeholders for the database type
                const dbType = process.env.DB_TYPE || 'sqlite';
                let query;
                let params;
                
                if (dbType === 'postgresql') {
                    // PostgreSQL: use ANY with array
                    query = `SELECT id, question_order FROM order_sets WHERE id = ANY($1::text[])`;
                    params = [orderSetIds];
                } else {
                    // SQLite: use IN with placeholders
                    const placeholders = orderSetIds.map(() => '?').join(',');
                    query = `SELECT id, question_order FROM order_sets WHERE id IN (${placeholders})`;
                    params = orderSetIds;
                }
                
                const orderSetsResult = await db.query(query, params);
                orderSetsResult.rows.forEach(row => {
                    // Handle both PostgreSQL array and JSON array formats
                    let questionCount = 8; // default
                    if (row.question_order) {
                        if (Array.isArray(row.question_order)) {
                            questionCount = row.question_order.length;
                        } else if (typeof row.question_order === 'string') {
                            try {
                                const parsed = JSON.parse(row.question_order);
                                questionCount = Array.isArray(parsed) ? parsed.length : 8;
                            } catch {
                                questionCount = 8;
                            }
                        }
                    }
                    orderSetCounts[row.id] = questionCount;
                });
            }
            
            const completionPercentages = completionData.rows
                .map(row => {
                    const answered = parseInt(row.questions_answered) || 0;
                    const total = orderSetCounts[row.order_set_id] || 8; // default to 8 questions
                    return total > 0 ? (answered / total) * 100 : 0;
                })
                .filter(pct => !isNaN(pct) && isFinite(pct));
            
            if (completionPercentages.length > 0) {
                const sum = completionPercentages.reduce((a, b) => a + b, 0);
                avgCompletion = sum / completionPercentages.length;
            }
        }
        
        // Calculate drop-offs dynamically from question progression
        // Count sessions that answered at least one question but didn't complete all questions
        const dropoffData = await db.query(
            `SELECT 
                cs.id as session_id,
                cs.order_set_id,
                COUNT(DISTINCT CASE WHEN qe.event_type = 'answered' THEN qe.question_id END) as questions_answered
            FROM chat_sessions cs
            LEFT JOIN question_events qe ON cs.id = qe.session_id AND qe.created_at >= ?
            WHERE cs.created_at >= ?
            GROUP BY cs.id, cs.order_set_id
            HAVING COUNT(DISTINCT CASE WHEN qe.event_type = 'answered' THEN qe.question_id END) > 0`,
            [sinceDate, sinceDate]
        );
        
        // Get order set question counts for drop-off calculation
        const dropoffOrderSetIds = [...new Set(dropoffData.rows.map(r => r.order_set_id).filter(Boolean))];
        const dropoffOrderSetCounts = {};
        
        if (dropoffOrderSetIds.length > 0) {
            const dbType = process.env.DB_TYPE || 'sqlite';
            let query;
            let params;
            
            if (dbType === 'postgresql') {
                query = `SELECT id, question_order FROM order_sets WHERE id = ANY($1::text[])`;
                params = [dropoffOrderSetIds];
            } else {
                const placeholders = dropoffOrderSetIds.map(() => '?').join(',');
                query = `SELECT id, question_order FROM order_sets WHERE id IN (${placeholders})`;
                params = dropoffOrderSetIds;
            }
            
            const dropoffOrderSetsResult = await db.query(query, params);
            dropoffOrderSetsResult.rows.forEach(row => {
                let questionCount = 8;
                if (row.question_order) {
                    if (Array.isArray(row.question_order)) {
                        questionCount = row.question_order.length;
                    } else if (typeof row.question_order === 'string') {
                        try {
                            const parsed = JSON.parse(row.question_order);
                            questionCount = Array.isArray(parsed) ? parsed.length : 8;
                        } catch {
                            questionCount = 8;
                        }
                    }
                }
                dropoffOrderSetCounts[row.id] = questionCount;
            });
        }
        
        // Count sessions that didn't complete (answered < total questions)
        let totalDropoffs = 0;
        dropoffData.rows.forEach(row => {
            const answered = parseInt(row.questions_answered) || 0;
            const total = dropoffOrderSetCounts[row.order_set_id] || 8;
            if (answered > 0 && answered < total) {
                totalDropoffs++;
            }
        });
        
        return {
            totalSessions: sessions.rows[0]?.total || 0,
            avgCompletion: parseFloat(avgCompletion.toFixed(2)),
            avgTime: parseFloat(sessions.rows[0]?.avg_time || 0),
            totalEvents: events.rows[0]?.total || 0,
            totalDropoffs: totalDropoffs
        };
    }
    
    async getOrderSetStats(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        // Get order sets with session counts
        const orderSetsResult = await db.query(
            `SELECT 
                os.id,
                os.name,
                os.description,
                os.question_order,
                COUNT(DISTINCT cs.id) as total_sessions,
                AVG(cs.total_time_ms) as avg_time_ms
            FROM order_sets os
            LEFT JOIN chat_sessions cs ON os.id = cs.order_set_id AND cs.created_at >= ?
            WHERE os.active = TRUE
            GROUP BY os.id, os.name, os.description, os.question_order
            ORDER BY total_sessions DESC`,
            [sinceDate]
        );
        
        // Get completion data per session
        const completionData = await db.query(
            `SELECT 
                cs.id as session_id,
                cs.order_set_id,
                COUNT(DISTINCT CASE WHEN qe.event_type = 'answered' THEN qe.question_id END) as questions_answered
            FROM chat_sessions cs
            LEFT JOIN question_events qe ON cs.id = qe.session_id AND qe.created_at >= ?
            WHERE cs.created_at >= ?
            GROUP BY cs.id, cs.order_set_id`,
            [sinceDate, sinceDate]
        );
        
        // Build order set question counts
        const orderSetCounts = {};
        orderSetsResult.rows.forEach(row => {
            let questionCount = 8;
            if (row.question_order) {
                if (Array.isArray(row.question_order)) {
                    questionCount = row.question_order.length;
                } else if (typeof row.question_order === 'string') {
                    try {
                        const parsed = JSON.parse(row.question_order);
                        questionCount = Array.isArray(parsed) ? parsed.length : 8;
                    } catch {
                        questionCount = 8;
                    }
                }
            }
            orderSetCounts[row.id] = questionCount;
        });
        
        // Group completion data by order set
        const orderSetCompletions = {};
        completionData.rows.forEach(row => {
            const orderSetId = row.order_set_id;
            if (!orderSetCompletions[orderSetId]) {
                orderSetCompletions[orderSetId] = {
                    total: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                    completionSum: 0
                };
            }
            
            const answered = parseInt(row.questions_answered) || 0;
            const total = orderSetCounts[orderSetId] || 8;
            const completionPercentage = total > 0 ? (answered / total) * 100 : 0;
            
            orderSetCompletions[orderSetId].total++;
            orderSetCompletions[orderSetId].completionSum += completionPercentage;
            
            if (completionPercentage >= 90) {
                orderSetCompletions[orderSetId].high++;
            } else if (completionPercentage >= 50) {
                orderSetCompletions[orderSetId].medium++;
            } else if (completionPercentage > 0) {
                orderSetCompletions[orderSetId].low++;
            }
        });
        
        return orderSetsResult.rows.map(row => {
            const completions = orderSetCompletions[row.id] || { total: 0, high: 0, medium: 0, low: 0, completionSum: 0 };
            const avgCompletion = completions.total > 0 ? completions.completionSum / completions.total : 0;
            
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                totalSessions: parseInt(row.total_sessions) || 0,
                avgCompletion: parseFloat(avgCompletion.toFixed(2)),
                highCompletionCount: completions.high,
                mediumCompletionCount: completions.medium,
                lowCompletionCount: completions.low,
                avgTimeMs: parseFloat(row.avg_time_ms || 0)
            };
        });
    }
    
    async getDropoffStats(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        // Calculate drop-offs from question_events: sessions that started a question but didn't answer the next one
        // This is more accurate than relying on dropoff_points table which may not have all drop-offs
        
        // First, get all sessions with their question progression
        const sessionProgress = await db.query(
            `SELECT 
                cs.id as session_id,
                cs.order_set_id,
                qe.question_id,
                qe.question_index,
                qe.event_type
            FROM chat_sessions cs
            LEFT JOIN question_events qe ON cs.id = qe.session_id
            WHERE cs.created_at >= ?
            ORDER BY cs.id, qe.question_index, qe.created_at`,
            [sinceDate]
        );
        
        // Group by session and find drop-off points
        const sessionMap = {};
        sessionProgress.rows.forEach(row => {
            const sessionId = row.session_id;
            if (!sessionMap[sessionId]) {
                sessionMap[sessionId] = {
                    orderSetId: row.order_set_id,
                    questions: []
                };
            }
            if (row.question_id && row.event_type === 'answered') {
                sessionMap[sessionId].questions.push({
                    questionId: row.question_id,
                    questionIndex: row.question_index
                });
            }
        });
        
        // Get order sets to determine expected question order
        const orderSetIds = [...new Set(Object.values(sessionMap).map(s => s.orderSetId).filter(Boolean))];
        const orderSets = {};
        
        if (orderSetIds.length > 0) {
            const dbType = process.env.DB_TYPE || 'sqlite';
            let query;
            let params;
            
            if (dbType === 'postgresql') {
                query = `SELECT id, question_order FROM order_sets WHERE id = ANY($1::text[])`;
                params = [orderSetIds];
            } else {
                const placeholders = orderSetIds.map(() => '?').join(',');
                query = `SELECT id, question_order FROM order_sets WHERE id IN (${placeholders})`;
                params = orderSetIds;
            }
            
            const orderSetsResult = await db.query(query, params);
            orderSetsResult.rows.forEach(row => {
                let questionOrder = [];
                if (row.question_order) {
                    if (Array.isArray(row.question_order)) {
                        questionOrder = row.question_order;
                    } else if (typeof row.question_order === 'string') {
                        try {
                            const parsed = JSON.parse(row.question_order);
                            questionOrder = Array.isArray(parsed) ? parsed : [];
                        } catch {
                            questionOrder = [];
                        }
                    }
                }
                orderSets[row.id] = questionOrder;
            });
        }
        
        // Calculate drop-offs: find where a session answered question N but not N+1
        const dropoffMap = {};
        
        Object.values(sessionMap).forEach(session => {
            const expectedOrder = orderSets[session.orderSetId] || [];
            const answeredQuestions = session.questions.map(q => q.questionIndex).sort((a, b) => a - b);
            
            // Find the highest answered question index
            if (answeredQuestions.length > 0) {
                const maxAnsweredIndex = Math.max(...answeredQuestions);
                const expectedNextIndex = maxAnsweredIndex + 1;
                
                // Check if there's an expected next question
                if (expectedNextIndex < expectedOrder.length) {
                    const dropoffQuestionId = expectedOrder[expectedNextIndex];
                    const key = `${session.orderSetId || 'unknown'}_${dropoffQuestionId}_${expectedNextIndex}`;
                    
                    if (!dropoffMap[key]) {
                        dropoffMap[key] = {
                            orderSetId: session.orderSetId,
                            questionId: dropoffQuestionId,
                            questionIndex: expectedNextIndex,
                            dropoffCount: 0,
                            totalCompletion: 0
                        };
                    }
                    
                    // Calculate completion at drop-off
                    const completionAtDropoff = (answeredQuestions.length / expectedOrder.length) * 100;
                    dropoffMap[key].dropoffCount++;
                    dropoffMap[key].totalCompletion += completionAtDropoff;
                }
            }
        });
        
        // Convert to array and calculate averages
        const dropoffs = Object.values(dropoffMap).map(dropoff => ({
            orderSetId: dropoff.orderSetId,
            questionId: dropoff.questionId,
            questionIndex: dropoff.questionIndex,
            dropoffCount: dropoff.dropoffCount,
            avgCompletionAtDropoff: dropoff.dropoffCount > 0 
                ? dropoff.totalCompletion / dropoff.dropoffCount 
                : 0
        }));
        
        // Sort by dropoff count descending
        dropoffs.sort((a, b) => b.dropoffCount - a.dropoffCount);
        
        return dropoffs.slice(0, 50); // Return top 50
    }
    
    async getQuestionStats(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        const result = await db.query(
            `SELECT 
                qe.order_set_id,
                qe.question_id,
                qe.question_index,
                COUNT(CASE WHEN qe.event_type = 'started' THEN 1 END) as started_count,
                COUNT(CASE WHEN qe.event_type = 'answered' THEN 1 END) as answered_count,
                AVG(CASE WHEN qe.time_to_answer_ms IS NOT NULL THEN qe.time_to_answer_ms END) as avg_time_to_answer
            FROM question_events qe
            WHERE qe.created_at >= ?
            GROUP BY qe.order_set_id, qe.question_id, qe.question_index
            ORDER BY qe.order_set_id, qe.question_index`,
            [sinceDate]
        );
        
        return result.rows.map(row => ({
            orderSetId: row.order_set_id,
            questionId: row.question_id,
            questionIndex: row.question_index,
            startedCount: parseInt(row.started_count) || 0,
            answeredCount: parseInt(row.answered_count) || 0,
            avgTimeToAnswer: parseFloat(row.avg_time_to_answer || 0),
            answerRate: row.started_count > 0 
                ? (parseFloat(row.answered_count) / parseFloat(row.started_count) * 100).toFixed(2)
                : 0
        }));
    }
    
    async getCompletionRates(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        // Calculate completion rates dynamically from question_events
        const completionData = await db.query(
            `SELECT 
                cs.id as session_id,
                cs.order_set_id,
                COUNT(DISTINCT CASE WHEN qe.event_type = 'answered' THEN qe.question_id END) as questions_answered
            FROM chat_sessions cs
            LEFT JOIN question_events qe ON cs.id = qe.session_id AND qe.created_at >= ?
            WHERE cs.created_at >= ?
            GROUP BY cs.id, cs.order_set_id`,
            [sinceDate, sinceDate]
        );
        
        // Get order set question counts
        const orderSetIds = [...new Set(completionData.rows.map(r => r.order_set_id).filter(Boolean))];
        const orderSetCounts = {};
        
        if (orderSetIds.length > 0) {
            const dbType = process.env.DB_TYPE || 'sqlite';
            let query;
            let params;
            
            if (dbType === 'postgresql') {
                query = `SELECT id, question_order FROM order_sets WHERE id = ANY($1::text[])`;
                params = [orderSetIds];
            } else {
                const placeholders = orderSetIds.map(() => '?').join(',');
                query = `SELECT id, question_order FROM order_sets WHERE id IN (${placeholders})`;
                params = orderSetIds;
            }
            
            const orderSetsResult = await db.query(query, params);
            orderSetsResult.rows.forEach(row => {
                let questionCount = 8; // default
                if (row.question_order) {
                    if (Array.isArray(row.question_order)) {
                        questionCount = row.question_order.length;
                    } else if (typeof row.question_order === 'string') {
                        try {
                            const parsed = JSON.parse(row.question_order);
                            questionCount = Array.isArray(parsed) ? parsed.length : 8;
                        } catch {
                            questionCount = 8;
                        }
                    }
                }
                orderSetCounts[row.id] = questionCount;
            });
        }
        
        // Calculate completion percentages and categorize
        const categories = {
            high: 0,
            medium: 0,
            low: 0
        };
        
        completionData.rows.forEach(row => {
            const answered = parseInt(row.questions_answered) || 0;
            const total = orderSetCounts[row.order_set_id] || 8;
            const completionPercentage = total > 0 ? (answered / total) * 100 : 0;
            
            if (completionPercentage >= 90) {
                categories.high++;
            } else if (completionPercentage >= 50) {
                categories.medium++;
            } else if (completionPercentage > 0) {
                categories.low++;
            }
        });
        
        return categories;
    }
}

module.exports = new DashboardService();

