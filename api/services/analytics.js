// ============================================
// ANALYTICS SERVICE
// Handles analytics event processing and storage
// ============================================

const db = require('../db/database');

class AnalyticsService {
    async handleEvent(eventType, sessionId, timestamp, data) {
        const eventTimestamp = timestamp ? new Date(timestamp) : new Date();
        
        switch (eventType) {
            case 'order_set_selected':
                return await this.handleOrderSetSelected(sessionId, eventTimestamp, data);
                
            case 'question_started':
                return await this.handleQuestionStarted(sessionId, eventTimestamp, data);
                
            case 'question_answered':
                return await this.handleQuestionAnswered(sessionId, eventTimestamp, data);
                
            case 'question_flow_completed':
                return await this.handleQuestionFlowCompleted(sessionId, eventTimestamp, data);
                
            case 'question_flow_data':
                return await this.handleQuestionFlowData(sessionId, eventTimestamp, data);
                
            default:
                console.warn(`Unknown event type: ${eventType}`);
                return { success: false, message: 'Unknown event type' };
        }
    }
    
    async handleOrderSetSelected(sessionId, timestamp, data) {
        // Ensure order set exists (create if it doesn't)
        if (data.orderSetId) {
            try {
                const existingOrderSet = await db.query(
                    `SELECT id FROM order_sets WHERE id = ?`,
                    [data.orderSetId]
                );
                
                if (existingOrderSet.rows.length === 0) {
                    // Create order set if it doesn't exist
                    await db.query(
                        `INSERT INTO order_sets (id, name, description, question_order, active, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)
                         ON CONFLICT (id) DO NOTHING`,
                        [
                            data.orderSetId,
                            data.orderSetName || `Order Set ${data.orderSetId}`,
                            data.description || null,
                            data.questionOrder ? JSON.stringify(data.questionOrder) : null,
                            true,
                            timestamp
                        ]
                    );
                }
            } catch (err) {
                console.warn('Could not ensure order set exists:', err.message);
            }
        }
        
        // Create or update session
        const userInfoJson = JSON.stringify(data.userInfo || {});
        
        // Check if session exists
        const existing = await db.query(
            `SELECT id FROM chat_sessions WHERE id = ?`,
            [sessionId]
        );
        
        if (existing.rows.length > 0) {
            // Update existing session (set order_set_id to null if it doesn't exist)
            try {
                await db.query(
                    `UPDATE chat_sessions 
                     SET order_set_id = ?, user_info = ?, start_time = ?
                     WHERE id = ?`,
                    [data.orderSetId || null, userInfoJson, timestamp, sessionId]
                );
            } catch (err) {
                // If foreign key constraint fails, set to null
                if (err.code === '23503') {
                    await db.query(
                        `UPDATE chat_sessions 
                         SET order_set_id = NULL, user_info = ?, start_time = ?
                         WHERE id = ?`,
                        [userInfoJson, timestamp, sessionId]
                    );
                } else {
                    throw err;
                }
            }
        } else {
            // Insert new session (set order_set_id to null if it doesn't exist)
            try {
                await db.query(
                    `INSERT INTO chat_sessions (id, order_set_id, user_info, start_time, created_at)
                     VALUES (?, ?, ?, ?, ?)`,
                    [sessionId, data.orderSetId || null, userInfoJson, timestamp, timestamp]
                );
            } catch (err) {
                // If foreign key constraint fails, insert with null order_set_id
                if (err.code === '23503') {
                    await db.query(
                        `INSERT INTO chat_sessions (id, order_set_id, user_info, start_time, created_at)
                         VALUES (?, NULL, ?, ?, ?)`,
                        [sessionId, userInfoJson, timestamp, timestamp]
                    );
                } else {
                    throw err;
                }
            }
        }
        
        return { success: true };
    }
    
    async handleQuestionStarted(sessionId, timestamp, data) {
        // Ensure session exists first (create if it doesn't)
        try {
            const existingSession = await db.query(
                `SELECT id FROM chat_sessions WHERE id = ?`,
                [sessionId]
            );
            
            if (existingSession.rows.length === 0) {
                // Create session if it doesn't exist (handle foreign key constraint)
                try {
                    await db.query(
                        `INSERT INTO chat_sessions (id, order_set_id, user_info, start_time, created_at)
                         VALUES (?, ?, ?, ?, ?)
                         ON CONFLICT (id) DO NOTHING`,
                        [
                            sessionId,
                            data.orderSetId || null,
                            JSON.stringify({}),
                            timestamp,
                            timestamp
                        ]
                    );
                } catch (err) {
                    // If foreign key constraint fails, insert with null order_set_id
                    if (err.code === '23503') {
                        await db.query(
                            `INSERT INTO chat_sessions (id, order_set_id, user_info, start_time, created_at)
                             VALUES (?, NULL, ?, ?, ?)
                             ON CONFLICT (id) DO NOTHING`,
                            [
                                sessionId,
                                JSON.stringify({}),
                                timestamp,
                                timestamp
                            ]
                        );
                    } else {
                        throw err;
                    }
                }
            }
        } catch (err) {
            // If session creation fails, log but continue
            console.warn('Could not ensure session exists:', err.message);
        }
        
        // Insert question event
        await db.query(
            `INSERT INTO question_events 
             (session_id, order_set_id, question_id, question_index, event_type, timestamp, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                sessionId,
                data.orderSetId || null,
                data.questionId || null,
                data.questionIndex !== undefined ? data.questionIndex : null,
                'started',
                timestamp,
                timestamp
            ]
        );
        
        return { success: true };
    }
    
    async handleQuestionAnswered(sessionId, timestamp, data) {
        // Ensure session exists first
        try {
            const existingSession = await db.query(
                `SELECT id FROM chat_sessions WHERE id = ?`,
                [sessionId]
            );
            
            if (existingSession.rows.length === 0) {
                try {
                    await db.query(
                        `INSERT INTO chat_sessions (id, order_set_id, user_info, start_time, created_at)
                         VALUES (?, ?, ?, ?, ?)
                         ON CONFLICT (id) DO NOTHING`,
                        [
                            sessionId,
                            data.orderSetId || null,
                            JSON.stringify({}),
                            timestamp,
                            timestamp
                        ]
                    );
                } catch (err) {
                    // If foreign key constraint fails, insert with null order_set_id
                    if (err.code === '23503') {
                        await db.query(
                            `INSERT INTO chat_sessions (id, order_set_id, user_info, start_time, created_at)
                             VALUES (?, NULL, ?, ?, ?)
                             ON CONFLICT (id) DO NOTHING`,
                            [
                                sessionId,
                                JSON.stringify({}),
                                timestamp,
                                timestamp
                            ]
                        );
                    } else {
                        throw err;
                    }
                }
            }
        } catch (err) {
            console.warn('Could not ensure session exists:', err.message);
        }
        
        // Insert question event
        await db.query(
            `INSERT INTO question_events 
             (session_id, order_set_id, question_id, question_index, event_type, answer, time_to_answer_ms, timestamp, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sessionId,
                data.orderSetId || null,
                data.questionId || null,
                data.questionIndex !== undefined ? data.questionIndex : null,
                'answered',
                data.answer || null,
                data.timeToAnswer || null,
                timestamp,
                timestamp
            ]
        );
        
        return { success: true };
    }
    
    async handleQuestionFlowCompleted(sessionId, timestamp, data) {
        // Update session with completion data
        await db.query(
            `UPDATE chat_sessions 
             SET end_time = ?, completion_percentage = ?, total_time_ms = ?
             WHERE id = ?`,
            [
                timestamp,
                data.completionPercentage || null,
                data.totalTime || null,
                sessionId
            ]
        );
        
        // Record drop-off if completion is less than 100%
        if (data.completionPercentage < 100) {
            const lastQuestion = await db.query(
                `SELECT question_id, question_index 
                 FROM question_events 
                 WHERE session_id = ? AND event_type = 'answered'
                 ORDER BY question_index DESC LIMIT 1`,
                [sessionId]
            );
            
            if (lastQuestion.rows.length > 0) {
                const lastQ = lastQuestion.rows[0];
                await db.query(
                    `INSERT INTO dropoff_points 
                     (session_id, order_set_id, question_id, question_index, completion_at_dropoff, timestamp, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        sessionId,
                        data.orderSetId || null,
                        lastQ.question_id,
                        lastQ.question_index,
                        data.completionPercentage || 0,
                        timestamp,
                        timestamp
                    ]
                );
            }
        }
        
        return { success: true };
    }
    
    async handleQuestionFlowData(sessionId, timestamp, data) {
        // Store complete flow data
        // This is a comprehensive event that includes all question data
        
        // Update session
        const userInfoJson = JSON.stringify(data.userInfo || {});
        const questionOrderJson = JSON.stringify(data.questionOrder || []);
        
        await db.query(
            `UPDATE chat_sessions 
             SET order_set_id = ?, user_info = ?, end_time = ?, 
                 completion_percentage = ?, total_time_ms = ?
             WHERE id = ?`,
            [
                data.orderSetId,
                userInfoJson,
                timestamp,
                data.completionPercentage || null,
                data.totalTime || null,
                sessionId
            ]
        );
        
        // Record individual question events if not already recorded
        if (data.questions && Array.isArray(data.questions)) {
            for (const question of data.questions) {
                if (question.answered) {
                    const questionIndex = data.questionOrder.indexOf(question.questionId);
                    // Check if event already exists
                    const existing = await db.query(
                        `SELECT id FROM question_events 
                         WHERE session_id = ? AND question_id = ? AND event_type = 'answered'`,
                        [sessionId, question.questionId]
                    );
                    
                    if (existing.rows.length === 0) {
                        await db.query(
                            `INSERT INTO question_events 
                             (session_id, order_set_id, question_id, question_index, event_type, answer, time_to_answer_ms, timestamp, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                sessionId,
                                data.orderSetId,
                                question.questionId,
                                questionIndex >= 0 ? questionIndex : null,
                                'answered',
                                question.answer || null,
                                question.timeToAnswer || null,
                                question.timestamp ? new Date(question.timestamp) : timestamp,
                                timestamp
                            ]
                        );
                    }
                }
            }
        }
        
        return { success: true };
    }
}

module.exports = new AnalyticsService();

