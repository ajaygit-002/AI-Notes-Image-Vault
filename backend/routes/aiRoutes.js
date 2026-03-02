const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateAIContent } = require('../controllers/aiController');

// Quick test endpoint (no auth) to verify proxy and route wiring
router.get('/test', (req, res) => {
	res.json({ ok: true, route: '/api/ai/test' });
});

// Debug POST route (no auth) - echoes body so frontend proxy/routing can be verified.
router.post('/debug', (req, res) => {
	res.json({ ok: true, route: '/api/ai/debug', body: req.body });
});

// Protected AI generation endpoint
router.post('/generate', authMiddleware, generateAIContent);

module.exports = router;
