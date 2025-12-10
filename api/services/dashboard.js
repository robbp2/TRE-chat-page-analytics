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
        
        const [sessions, events, dropoffs, completionData] = await Promise.all([
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
            db.query(
                `SELECT COUNT(*) as total FROM dropoff_points 
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
        
        return {
            totalSessions: sessions.rows[0]?.total || 0,
            avgCompletion: parseFloat(avgCompletion.toFixed(2)),
            avgTime: parseFloat(sessions.rows[0]?.avg_time || 0),
            totalEvents: events.rows[0]?.total || 0,
            totalDropoffs: dropoffs.rows[0]?.total || 0
        };
    }
    
    async getOrderSetStats(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        const result = await db.query(
            `SELECT 
                os.id,
                os.name,
                os.description,
                COUNT(DISTINCT cs.id) as total_sessions,
                AVG(cs.completion_percentage) as avg_completion,
                COUNT(DISTINCT CASE WHEN cs.completion_percentage >= 90 THEN cs.id END) as high_completion_count,
                COUNT(DISTINCT CASE WHEN cs.completion_percentage >= 50 AND cs.completion_percentage < 90 THEN cs.id END) as medium_completion_count,
                COUNT(DISTINCT CASE WHEN cs.completion_percentage < 50 THEN cs.id END) as low_completion_count,
                AVG(cs.total_time_ms) as avg_time_ms
            FROM order_sets os
            LEFT JOIN chat_sessions cs ON os.id = cs.order_set_id AND cs.created_at >= ?
            WHERE os.active = TRUE
            GROUP BY os.id, os.name, os.description
            ORDER BY total_sessions DESC`,
            [sinceDate]
        );
        
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            totalSessions: parseInt(row.total_sessions) || 0,
            avgCompletion: parseFloat(row.avg_completion || 0),
            highCompletionCount: parseInt(row.high_completion_count) || 0,
            mediumCompletionCount: parseInt(row.medium_completion_count) || 0,
            lowCompletionCount: parseInt(row.low_completion_count) || 0,
            avgTimeMs: parseFloat(row.avg_time_ms || 0)
        }));
    }
    
    async getDropoffStats(days = 30) {
        const sinceDate = this.getSinceDate(days);
        
        const result = await db.query(
            `SELECT 
                order_set_id,
                question_id,
                question_index,
                COUNT(*) as dropoff_count,
                AVG(completion_at_dropoff) as avg_completion_at_dropoff
            FROM dropoff_points
            WHERE created_at >= ?
            GROUP BY order_set_id, question_id, question_index
            ORDER BY dropoff_count DESC
            LIMIT 50`,
            [sinceDate]
        );
        
        return result.rows.map(row => ({
            orderSetId: row.order_set_id,
            questionId: row.question_id,
            questionIndex: row.question_index,
            dropoffCount: parseInt(row.dropoff_count) || 0,
            avgCompletionAtDropoff: parseFloat(row.avg_completion_at_dropoff || 0)
        }));
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
        
        const result = await db.query(
            `SELECT 
                CASE 
                    WHEN completion_percentage >= 90 THEN 'high'
                    WHEN completion_percentage >= 50 THEN 'medium'
                    ELSE 'low'
                END as completion_category,
                COUNT(*) as count
            FROM chat_sessions
            WHERE created_at >= ? AND completion_percentage IS NOT NULL
            GROUP BY completion_category`,
            [sinceDate]
        );
        
        const categories = {
            high: 0,
            medium: 0,
            low: 0
        };
        
        result.rows.forEach(row => {
            categories[row.completion_category] = parseInt(row.count) || 0;
        });
        
        return categories;
    }
}

module.exports = new DashboardService();

