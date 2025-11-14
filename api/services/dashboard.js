// ============================================
// DASHBOARD SERVICE
// Provides aggregated analytics data for dashboard
// ============================================

const db = require('../db/database');

class DashboardService {
    async getDashboardStats(days = 30) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        
        const [sessions, events, dropoffs] = await Promise.all([
            db.query(
                `SELECT COUNT(*) as total, 
                        AVG(completion_percentage) as avg_completion,
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
            )
        ]);
        
        return {
            totalSessions: sessions.rows[0]?.total || 0,
            avgCompletion: parseFloat(sessions.rows[0]?.avg_completion || 0),
            avgTime: parseFloat(sessions.rows[0]?.avg_time || 0),
            totalEvents: events.rows[0]?.total || 0,
            totalDropoffs: dropoffs.rows[0]?.total || 0
        };
    }
    
    async getOrderSetStats(days = 30) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        
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
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        
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
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        
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
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        
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

