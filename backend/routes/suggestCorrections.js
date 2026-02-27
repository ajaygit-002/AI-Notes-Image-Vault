const express = require('express');
const router = express.Router();
const LanguageToolApi = require('languagetool-api');

// POST /api/notes/suggest-corrections
router.post('/suggest-corrections', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const lt = new LanguageToolApi();
    const result = await lt.check({
      text,
      language: 'en-US'
    });
    res.json(result.matches); // suggestions and corrections
  } catch (error) {
    res.status(500).json({ error: 'Error checking text', details: error.message });
  }
});

module.exports = router;
