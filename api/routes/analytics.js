// ============================================
// ANALYTICS API ROUTES
// Handles analytics event tracking
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const analyticsService = require('../services/analytics');

// POST /api/analytics/event
// Track analytics events
router.post('/event', async (req, res) => {
    try {
        const { eventType, sessionId, timestamp, data } = req.body;
        
        if (!eventType || !sessionId) {
            return res.status(400).json({ 
                error: 'Missing required fields: eventType and sessionId' 
            });
        }
        
        await analyticsService.handleEvent(eventType, sessionId, timestamp, data);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Analytics event error:', error);
        res.status(500).json({ 
            error: 'Failed to record analytics event',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/analytics/batch
// Track multiple events at once
router.post('/batch', async (req, res) => {
    try {
        const { events } = req.body;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Events must be an array' });
        }
        
        const results = await Promise.all(
            events.map(event => 
                analyticsService.handleEvent(
                    event.eventType,
                    event.sessionId,
                    event.timestamp,
                    event.data
                ).catch(err => {
                    console.error('Batch event error:', err);
                    return { error: err.message };
                })
            )
        );
        
        res.json({ 
            success: true, 
            processed: results.length,
            errors: results.filter(r => r.error).length
        });
    } catch (error) {
        console.error('Analytics batch error:', error);
        res.status(500).json({ error: 'Failed to process batch events' });
    }
});

module.exports = router;

