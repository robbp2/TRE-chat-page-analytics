// ============================================
// DASHBOARD API ROUTES
// Provides analytics data for dashboard visualization
// ============================================

const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard');

// GET /api/dashboard/stats
// Get overall dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await dashboardService.getDashboardStats(days);
        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard stats',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/dashboard/order-sets
// Get order set performance statistics
router.get('/order-sets', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await dashboardService.getOrderSetStats(days);
        res.json(stats);
    } catch (error) {
        console.error('Order set stats error:', error);
        res.status(500).json({ error: 'Failed to fetch order set stats' });
    }
});

// GET /api/dashboard/dropoffs
// Get drop-off point analysis
router.get('/dropoffs', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await dashboardService.getDropoffStats(days);
        res.json(stats);
    } catch (error) {
        console.error('Dropoff stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dropoff stats' });
    }
});

// GET /api/dashboard/questions
// Get question performance statistics
router.get('/questions', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await dashboardService.getQuestionStats(days);
        res.json(stats);
    } catch (error) {
        console.error('Question stats error:', error);
        res.status(500).json({ error: 'Failed to fetch question stats' });
    }
});

// GET /api/dashboard/completion-rates
// Get completion rate breakdown
router.get('/completion-rates', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await dashboardService.getCompletionRates(days);
        res.json(stats);
    } catch (error) {
        console.error('Completion rates error:', error);
        res.status(500).json({ error: 'Failed to fetch completion rates' });
    }
});

// DELETE /api/dashboard/clear-data
// Clear all analytics data (keeps order_sets and questions)
router.delete('/clear-data', async (req, res) => {
    try {
        const db = require('../db/database');
        
        // Clear data tables in order (respecting foreign key constraints)
        // First clear dependent tables
        await db.query('DELETE FROM dropoff_points');
        await db.query('DELETE FROM question_events');
        await db.query('DELETE FROM chat_sessions');
        
        // Note: We keep order_sets and questions tables intact
        
        res.json({ 
            success: true, 
            message: 'All analytics data has been cleared',
            cleared: {
                dropoff_points: true,
                question_events: true,
                chat_sessions: true
            }
        });
    } catch (error) {
        console.error('Clear data error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to clear analytics data',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

