
const express = require('express');
const router = express.Router();


router.post('/suggest-corrections', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    return res.status(501).json({ error: 'Language check not available on server' });
  } catch (error) {
    res.status(500).json({ error: 'Error checking text', details: error.message });
  }
});

module.exports = router;
