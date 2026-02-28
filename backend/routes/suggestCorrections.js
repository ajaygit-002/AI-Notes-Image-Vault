
const express = require('express');
const router = express.Router();

// Helper to get a fetch implementation that works in older Node versions
async function getFetch() {
  if (global.fetch) return global.fetch;
  // Dynamically import node-fetch only if needed
  const nf = await import('node-fetch');
  return nf.default;
}

// Local fallback: produce a more useful, deterministic correction when Gemini
// is unavailable (rate-limited, not configured) so the frontend can show
// practical corrections instead of a vague demo message.
function generateLocalCorrections(text) {
  const original = String(text || '');
  const trimmed = original.trim();

  // Basic corrections: capitalize 'i' -> 'I', capitalize first char,
  // ensure ending punctuation.
  let corrected = trimmed.replace(/\bi\b/g, 'I');
  if (corrected.length) {
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
    if (!/[.!?]$/.test(corrected)) corrected += '.';
  }

  // Small heuristics for suggestions
  const suggestions = [];
  if (trimmed && trimmed[0] === trimmed[0].toLowerCase()) suggestions.push('Capitalize the first word.');
  if (trimmed && !/[.!?]$/.test(trimmed)) suggestions.push('Add ending punctuation (., ! or ?).');
  if (trimmed.split(/\s+/).length <= 3) suggestions.push('Consider adding more detail for clarity.');

  const suggestionText = suggestions.length
    ? suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : 'No simple suggestions; text looks fine.';

  const out = `Original text:\n"${original}"\n\nCorrected text:\n"${corrected}"\n\nSuggested corrections:\n${suggestionText}`;

  // Also provide word-level correction suggestions using the word-list helpers
  const wordCorrections = suggestWordCorrectionsForText(original, 10);

  return {
    candidates: [{
      content: { parts: [{ text: out }] }
    }],
    wordCorrections
  };
}

// --- Word suggestion helpers (uses leven + word-list) ---
let _wordSet = null;
let _wordArray = null;
function loadWordListIfNeeded() {
  if (_wordSet) return;
  try {
    const path = require('word-list');
    const fs = require('fs');
    const txt = fs.readFileSync(path, 'utf8');
    _wordArray = txt.split('\n').filter(Boolean);
    _wordSet = new Set(_wordArray.map(w => w.toLowerCase()));
  } catch (err) {
    _wordSet = new Set();
    _wordArray = [];
    if (process.env.DEBUG) console.warn('Could not load word-list:', err.message);
  }
}

const leven = (() => {
  try { return require('leven'); } catch { return null; }
})();

function suggestWordCorrectionsForText(text, maxSuggestions = 5) {
  loadWordListIfNeeded();
  if (!_wordArray || !_wordArray.length || !leven) return [];

  const tokens = String(text || '').split(/\s+/).filter(Boolean);
  const corrections = [];

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i].replace(/[^a-zA-Z']/g, '');
    if (!raw) continue;
    const lower = raw.toLowerCase();
    // Even if the word exists in the dictionary, prefer suggesting a more
    // common word if one is very close (handles rare variants like 'nae' -> 'name').
    const originalIndex = _wordArray.indexOf(lower);

    // candidates: filter by first letter to speed up, then compute distance
    const first = lower[0];
    const candidates = _wordArray.filter(w => w[0] === first).slice(0, 20000);
    let best = null;
    let bestDist = Infinity;
    let secondBest = null;
    let secondBestDist = Infinity;
    for (const c of candidates) {
      const d = leven(lower, c);
      if (d < bestDist) {
        secondBest = best; secondBestDist = bestDist;
        bestDist = d; best = c;
      } else if (d < secondBestDist) {
        secondBestDist = d; secondBest = c;
      }
      if (bestDist === 0 && secondBestDist === 1) break;
    }

    // If original is present but a closer/more-common candidate exists,
    // suggest replacement when it makes sense.
    // If the best match is the word itself (distance 0), but a nearby
    // second-best exists that is much more common (e.g., 'nae' vs 'name'),
    // consider suggesting the second-best.
    let chosen = null;
    let chosenDist = Infinity;
    if (best) {
      chosen = best; chosenDist = bestDist;
      if (bestDist === 0 && secondBest && secondBestDist <= Math.max(2, Math.floor(lower.length / 3))) {
        const bestIdx = _wordArray.indexOf(best);
        const secIdx = _wordArray.indexOf(secondBest);
        if (bestIdx > -1 && secIdx > -1 && secIdx + 1000 < bestIdx) {
          chosen = secondBest; chosenDist = secondBestDist;
        }
      }
    }

    if (chosen && chosenDist <= Math.max(2, Math.floor(lower.length / 3))) {
      const chosenIndex = _wordArray.indexOf(chosen);
      if (!_wordSet.has(lower) || (originalIndex > -1 && chosenIndex > -1 && chosenIndex + 1000 < originalIndex)) {
        corrections.push({ index: i, from: tokens[i], to: chosen });
      }
    }
  }

  return corrections.slice(0, maxSuggestions);
}

// Suggest corrections for a piece of text using an external LLM (Gemini).
// Security note: do NOT hardcode API keys in source. Set the following
// environment variables on your machine / server instead:
//   GEMINI_API_KEY="your_free_api_key"
//   GEMINI_API_URL="https://<provider-endpoint>/v1/generate"
// Example (PowerShell): $env:GEMINI_API_KEY = 'your_free_api_key'

router.post('/suggest-corrections', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = process.env.GEMINI_API_URL;
  const DEMO_MODE = process.env.DEMO_MODE === 'true';

  // Debug logging (only if DEBUG env var is set)
  if (process.env.DEBUG) {
    console.log('DEBUG /suggest-corrections:');
    console.log('  GEMINI_API_KEY:', GEMINI_API_KEY ? `✓ (${GEMINI_API_KEY.slice(0, 10)}...)` : '✗ MISSING');
    console.log('  GEMINI_API_URL:', GEMINI_API_URL ? `✓ ${GEMINI_API_URL}` : '✗ MISSING');
    console.log('  DEMO_MODE:', DEMO_MODE);
  }

  if (!GEMINI_API_KEY || !GEMINI_API_URL) {
    // Inform the developer how to configure the key instead of exposing secrets
    if (DEMO_MODE) {
      console.log('INFO: Running in DEMO_MODE, returning mock corrections');
      return res.json({ ok: true, data: getMockCorrections(text), demo: true });
    }
    return res.status(501).json({
      error: 'Gemini API not configured',
      help: 'Set GEMINI_API_KEY and GEMINI_API_URL environment variables on the server, OR set DEMO_MODE=true to use mock responses'
    });
  }

  try {
    const fetch = await getFetch();

    // For Google Gemini API, we use the 'contents' format
    const payload = {
      contents: [{
        parts: [{
          text: `Suggest corrections and improvements for the following text:\n\n${text}`
        }]
      }]
    };

    // Google Gemini expects the API key as a query parameter, not in Authorization header
    const urlWithKey = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    if (process.env.DEBUG) {
      console.log('Calling Gemini API:', urlWithKey.slice(0, 80) + '...');
      console.log('Payload:', JSON.stringify(payload).slice(0, 100) + '...');
    }

    const apiRes = await fetch(urlWithKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (process.env.DEBUG) console.log('Gemini API Response Status:', apiRes.status);

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      if (process.env.DEBUG) console.log('Gemini API Error:', errText);

      // Handle rate limiting (429) by returning a helpful local correction
      if (apiRes.status === 429) {
        console.warn('⚠️  Rate limited by Gemini API (429). Returning local corrections.');
        return res.json({ 
          ok: true, 
          data: generateLocalCorrections(text),
          demo: true,
          message: 'Gemini API quota exceeded. Returning local corrections instead.'
        });
      }

      return res.status(502).json({ 
        error: 'Upstream API error', 
        details: errText,
        help: 'Check API key validity and quota at https://ai.dev/rate-limit'
      });
    }

    const result = await apiRes.json();

    // Return the provider's response to the frontend. Frontend should
    // extract the useful fields (e.g., text) depending on the provider.
    return res.json({ ok: true, data: result });
  } catch (error) {
    if (process.env.DEBUG) console.error('Route error:', error.message);
    
    // On network error, optionally fall back to local corrections
    if (DEMO_MODE || error.message.includes('ENOTFOUND')) {
      console.warn('⚠️  Network error. Returning local corrections.');
      return res.json({ 
        ok: true,
        data: generateLocalCorrections(text),
        demo: true,
        message: 'Gemini API unreachable. Returning local corrections.'
      });
    }

    res.status(500).json({ error: 'Error checking text', details: error.message });
  }
});

module.exports = router;
