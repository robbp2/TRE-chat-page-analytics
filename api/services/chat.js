// ============================================
// CHAT SERVICE
// Handles conversation data storage
// ============================================

const db = require('../db/database');

class ChatService {
    /**
     * Store conversation data from chatbot
     * @param {Object} conversationData - Full conversation data object
     * @returns {Promise<Object>} Stored session data
     */
    async storeConversation(conversationData) {
        try {
            const {
                sessionId,
                startTime,
                endTime,
                messages = [],
                userInfo = {},
                metadata = {},
                questionAnswers = {},
                orderSetId,
                completionPercentage,
                totalTime,
                duration
            } = conversationData;

            if (!sessionId) {
                throw new Error('sessionId is required');
            }

            // Calculate total time from duration if provided
            const totalTimeMs = totalTime || (duration?.milliseconds) || null;
            const completionPct = completionPercentage || null;

            // Prepare data for storage
            const userInfoJson = typeof userInfo === 'string' ? userInfo : JSON.stringify(userInfo);
            const messagesJson = JSON.stringify(messages);
            const metadataJson = JSON.stringify(metadata);
            const questionAnswersJson = JSON.stringify(questionAnswers);

            // Check if session already exists
            const existing = await db.query(
                `SELECT id FROM chat_sessions WHERE id = ?`,
                [sessionId]
            );

            if (existing.rows.length > 0) {
                // Update existing session
                // Try to update with messages column (if it exists)
                try {
                    await db.query(
                        `UPDATE chat_sessions 
                         SET order_set_id = ?,
                             user_info = ?,
                             start_time = ?,
                             end_time = ?,
                             completion_percentage = ?,
                             total_time_ms = ?,
                             messages = ?,
                             metadata = ?,
                             question_answers = ?
                         WHERE id = ?`,
                        [
                            orderSetId || null,
                            userInfoJson,
                            startTime ? new Date(startTime) : null,
                            endTime ? new Date(endTime) : null,
                            completionPct,
                            totalTimeMs,
                            messagesJson,
                            metadataJson,
                            questionAnswersJson,
                            sessionId
                        ]
                    );
                } catch (err) {
                    // If columns don't exist, update without them
                    if (err.message.includes('no such column') || err.message.includes('column') && err.message.includes('does not exist')) {
                        await db.query(
                            `UPDATE chat_sessions 
                             SET order_set_id = ?,
                                 user_info = ?,
                                 start_time = ?,
                                 end_time = ?,
                                 completion_percentage = ?,
                                 total_time_ms = ?
                             WHERE id = ?`,
                            [
                                orderSetId || null,
                                userInfoJson,
                                startTime ? new Date(startTime) : null,
                                endTime ? new Date(endTime) : null,
                                completionPct,
                                totalTimeMs,
                                sessionId
                            ]
                        );
                        
                        // Store messages separately or log warning
                        console.warn('Messages column not found, storing in user_info for now');
                    } else {
                        throw err;
                    }
                }
            } else {
                // Insert new session
                try {
                    await db.query(
                        `INSERT INTO chat_sessions 
                         (id, order_set_id, user_info, start_time, end_time, 
                          completion_percentage, total_time_ms, messages, metadata, question_answers, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            sessionId,
                            orderSetId || null,
                            userInfoJson,
                            startTime ? new Date(startTime) : null,
                            endTime ? new Date(endTime) : null,
                            completionPct,
                            totalTimeMs,
                            messagesJson,
                            metadataJson,
                            questionAnswersJson,
                            new Date()
                        ]
                    );
                } catch (err) {
                    // If columns don't exist, insert without them
                    if (err.message.includes('no such column') || err.message.includes('column') && err.message.includes('does not exist')) {
                        await db.query(
                            `INSERT INTO chat_sessions 
                             (id, order_set_id, user_info, start_time, end_time, 
                              completion_percentage, total_time_ms, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                sessionId,
                                orderSetId || null,
                                JSON.stringify({ ...userInfo, messages, metadata, questionAnswers }),
                                startTime ? new Date(startTime) : null,
                                endTime ? new Date(endTime) : null,
                                completionPct,
                                totalTimeMs,
                                new Date()
                            ]
                        );
                    } else {
                        throw err;
                    }
                }
            }

            return {
                success: true,
                sessionId,
                message: 'Conversation stored successfully'
            };
        } catch (error) {
            console.error('Error storing conversation:', error);
            throw error;
        }
    }

    /**
     * Get conversation by session ID
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object|null>} Conversation data or null
     */
    async getConversation(sessionId) {
        try {
            const result = await db.query(
                `SELECT * FROM chat_sessions WHERE id = ?`,
                [sessionId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const session = result.rows[0];
            
            // Parse JSON fields
            if (session.user_info) {
                try {
                    session.user_info = typeof session.user_info === 'string' 
                        ? JSON.parse(session.user_info) 
                        : session.user_info;
                } catch (e) {
                    console.warn('Could not parse user_info:', e);
                }
            }

            if (session.messages) {
                try {
                    session.messages = typeof session.messages === 'string' 
                        ? JSON.parse(session.messages) 
                        : session.messages;
                } catch (e) {
                    console.warn('Could not parse messages:', e);
                }
            }

            if (session.metadata) {
                try {
                    session.metadata = typeof session.metadata === 'string' 
                        ? JSON.parse(session.metadata) 
                        : session.metadata;
                } catch (e) {
                    console.warn('Could not parse metadata:', e);
                }
            }

            if (session.question_answers) {
                try {
                    session.question_answers = typeof session.question_answers === 'string' 
                        ? JSON.parse(session.question_answers) 
                        : session.question_answers;
                } catch (e) {
                    console.warn('Could not parse question_answers:', e);
                }
            }

            return session;
        } catch (error) {
            console.error('Error getting conversation:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();

