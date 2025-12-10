// ============================================
// DIAGNOSTIC SCRIPT - Session Count Analysis
// Queries database directly to diagnose session counting issues
// ============================================

require('dotenv').config();
const db = require('../db/database');

async function diagnoseSessions() {
    console.log('🔍 Diagnosing Session Count Issues...\n');
    
    try {
        // Get total sessions count (last 30 days)
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);
        
        const totalSessions = await db.query(
            `SELECT COUNT(*) as total FROM chat_sessions WHERE created_at >= $1`,
            [sinceDate]
        );
        console.log(`📊 Total Sessions (last 30 days): ${totalSessions.rows[0]?.total || 0}\n`);
        
        // Get sessions grouped by order_set_id (including NULL)
        const sessionsByOrderSet = await db.query(
            `SELECT 
                CASE 
                    WHEN order_set_id IS NULL OR order_set_id = '' THEN 'unassigned'
                    ELSE order_set_id
                END as order_set_id,
                COUNT(*) as count
            FROM chat_sessions
            WHERE created_at >= $1
            GROUP BY CASE 
                WHEN order_set_id IS NULL OR order_set_id = '' THEN 'unassigned'
                ELSE order_set_id
            END
            ORDER BY count DESC`,
            [sinceDate]
        );
        
        console.log('📋 Sessions by Order Set:');
        let totalFromGrouping = 0;
        sessionsByOrderSet.rows.forEach(row => {
            console.log(`   ${row.order_set_id || 'NULL'}: ${row.count} sessions`);
            totalFromGrouping += parseInt(row.count || 0);
        });
        console.log(`\n   Total from grouping: ${totalFromGrouping}`);
        console.log(`   Match: ${totalFromGrouping === parseInt(totalSessions.rows[0]?.total || 0) ? '✅ YES' : '❌ NO - MISSING ' + (parseInt(totalSessions.rows[0]?.total || 0) - totalFromGrouping) + ' sessions'}\n`);
        
        // Get order sets that exist in the database
        const orderSets = await db.query(`SELECT id, name, active FROM order_sets ORDER BY id`);
        console.log('📦 Order Sets in Database:');
        orderSets.rows.forEach(row => {
            console.log(`   ${row.id}: ${row.name} (active: ${row.active})`);
        });
        console.log();
        
        // Check for sessions with order_set_id that don't exist in order_sets table
        const orphanedSessions = await db.query(
            `SELECT 
                cs.order_set_id,
                COUNT(*) as count
            FROM chat_sessions cs
            LEFT JOIN order_sets os ON cs.order_set_id = os.id
            WHERE cs.created_at >= $1
                AND cs.order_set_id IS NOT NULL 
                AND cs.order_set_id != ''
                AND os.id IS NULL
            GROUP BY cs.order_set_id
            ORDER BY count DESC`,
            [sinceDate]
        );
        
        if (orphanedSessions.rows.length > 0) {
            console.log('⚠️  Orphaned Sessions (order_set_id not in order_sets table):');
            orphanedSessions.rows.forEach(row => {
                console.log(`   ${row.order_set_id}: ${row.count} sessions`);
            });
            console.log();
        }
        
        // Get completion stats
        const completionStats = await db.query(
            `SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN completion_percentage >= 90 THEN 1 END) as completed_90_plus,
                COUNT(CASE WHEN completion_percentage >= 50 AND completion_percentage < 90 THEN 1 END) as completed_50_90,
                COUNT(CASE WHEN completion_percentage > 0 AND completion_percentage < 50 THEN 1 END) as completed_0_50,
                COUNT(CASE WHEN completion_percentage IS NULL OR completion_percentage = 0 THEN 1 END) as not_completed
            FROM chat_sessions
            WHERE created_at >= $1`,
            [sinceDate]
        );
        
        const stats = completionStats.rows[0];
        console.log('✅ Completion Stats (from completion_percentage field):');
        console.log(`   Total: ${stats.total_sessions}`);
        console.log(`   Completed (≥90%): ${stats.completed_90_plus}`);
        console.log(`   Medium (50-89%): ${stats.completed_50_90}`);
        console.log(`   Low (1-49%): ${stats.completed_0_50}`);
        console.log(`   Not Completed (0% or NULL): ${stats.not_completed}`);
        console.log();
        
        // Calculate drop-offs from question_events
        const dropoffAnalysis = await db.query(
            `SELECT 
                cs.id as session_id,
                cs.order_set_id,
                COUNT(DISTINCT CASE WHEN qe.event_type = 'answered' THEN qe.question_id END) as questions_answered
            FROM chat_sessions cs
            LEFT JOIN question_events qe ON cs.id = qe.session_id
            WHERE cs.created_at >= $1
            GROUP BY cs.id, cs.order_set_id`,
            [sinceDate]
        );
        
        // Get order set question counts
        const orderSetQuestionCounts = {};
        const orderSetIds = [...new Set(dropoffAnalysis.rows.map(r => r.order_set_id).filter(Boolean))];
        
        if (orderSetIds.length > 0) {
            const orderSetsResult = await db.query(
                `SELECT id, question_order FROM order_sets WHERE id = ANY($1::text[])`,
                [orderSetIds]
            );
            
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
                orderSetQuestionCounts[row.id] = questionCount;
            });
        }
        
        let completedCount = 0;
        let dropoffCount = 0;
        
        dropoffAnalysis.rows.forEach(row => {
            const answered = parseInt(row.questions_answered) || 0;
            const total = orderSetQuestionCounts[row.order_set_id] || 8;
            if (answered >= total) {
                completedCount++;
            } else {
                dropoffCount++;
            }
        });
        
        console.log('📉 Drop-off Analysis (from question_events):');
        console.log(`   Completed Sessions: ${completedCount} (${((completedCount / dropoffAnalysis.rows.length) * 100).toFixed(1)}%)`);
        console.log(`   Drop-off Sessions: ${dropoffCount} (${((dropoffCount / dropoffAnalysis.rows.length) * 100).toFixed(1)}%)`);
        console.log(`   Total Analyzed: ${dropoffAnalysis.rows.length}`);
        console.log();
        
        // Sample sessions to see what's happening
        console.log('🔬 Sample Sessions (first 10):');
        const sampleSessions = await db.query(
            `SELECT 
                id,
                order_set_id,
                completion_percentage,
                created_at
            FROM chat_sessions
            WHERE created_at >= $1
            ORDER BY created_at DESC
            LIMIT 10`,
            [sinceDate]
        );
        
        sampleSessions.rows.forEach((row, idx) => {
            console.log(`   ${idx + 1}. Session ${row.id.substring(0, 20)}...`);
            console.log(`      order_set_id: ${row.order_set_id || 'NULL'}`);
            console.log(`      completion_percentage: ${row.completion_percentage || 'NULL'}`);
            console.log(`      created_at: ${row.created_at}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        // Close database connection
        if (db && typeof db.end === 'function') {
            await db.end();
        }
        process.exit(0);
    }
}

diagnoseSessions();

