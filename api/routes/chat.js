// ============================================
// CHAT API ROUTES
// Handles conversation data submission
// ============================================

const express = require('express');
const router = express.Router();
const chatService = require('../services/chat');

// POST /api/chat/submit
// Submit conversation data from chatbot
router.post('/submit', async (req, res) => {
    try {
        const conversationData = req.body;
        
        if (!conversationData.sessionId) {
            return res.status(400).json({ 
                error: 'Missing required field: sessionId' 
            });
        }
        
        const result = await chatService.storeConversation(conversationData);
        
        res.json(result);
    } catch (error) {
        console.error('Chat submission error:', error);
        console.error('Conversation data:', JSON.stringify(req.body).substring(0, 500));
        res.status(500).json({ 
            error: 'Failed to store conversation data',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/chat/:sessionId
// Get conversation by session ID
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const conversation = await chatService.getConversation(sessionId);
        
        if (!conversation) {
            return res.status(404).json({ 
                error: 'Conversation not found' 
            });
        }
        
        res.json(conversation);
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve conversation',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

