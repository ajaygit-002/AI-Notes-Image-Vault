/*
  frontend/src/pages/createNote/CreateNote.jsx
  Simple note creation page with AI text correction.
  - User writes text in the content area
  - Clicks "Suggest Corrections" to get AI feedback
  - AI response displays below with an "Apply" button
  - Click "Apply" to auto-fill the corrected text
*/
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../components/style/createNote.css";

function CreateNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  
  // Store AI correction response and loading state
  const [aiResponse, setAiResponse] = useState(null);
  const [correctedPreview, setCorrectedPreview] = useState('');
  const [correctedWords, setCorrectedWords] = useState([]); // [{from, to, index}]
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMode, setAiMode] = useState('');
  // default to corrections if no mode selected
  React.useEffect(() => {
    if (!aiMode) setAiMode('corrections');
  }, []);
  
  const navigate = useNavigate();
  const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE || 'http://localhost:5000') : (import.meta.env.VITE_API_BASE || '');

  // Function: Call AI to get text corrections or other transformations
  const handleAISuggest = async (mode = 'corrections') => {
    setError("");
    setLoadingAI(true);
    setAiResponse(null);  // Clear previous response
    setAiMode(mode);

    // Quick API health check to ensure backend route/proxy is reachable and returns JSON
    try {
      const testRes = await fetch(`${API_BASE}/api/ai/test`, { method: 'GET' });
      const testText = await testRes.text();
      if (!testRes.ok) {
        throw new Error(`API test failed: ${testRes.status} - ${testText.slice(0,200)}`);
      }
      // if the test returned HTML, bail early with a helpful message
      if ((testText || '').trim().startsWith('<')) {
        throw new Error('API test returned HTML instead of JSON. Check backend route/proxy/order.');
      }
    } catch (apiTestErr) {
      setLoadingAI(false);
      console.error('API connectivity test failed:', apiTestErr);
      setError('Could not reach AI API: ' + String(apiTestErr.message || apiTestErr));
      return;
    }

    try {
      // Send the content and the requested mode to the backend AI route
      const res = await fetch(`${API_BASE}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ content, type: mode }),
      });

      // Read as text first to avoid JSON parse errors when server returns HTML (e.g. 404 page)
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // If the server returned HTML (starts with '<'), give a clearer error
        const trimmed = (text || '').trim();
        if (trimmed.startsWith('<')) {
          throw new Error('Server returned HTML instead of JSON (check backend route or CORS).');
        }
        parsed = text; // fallback to raw text
      }

      if (!res.ok) {
        const errMsg = (parsed && parsed.message) || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
        throw new Error(errMsg || 'AI suggestion failed');
      }

      // Normalize payload into the shape { success, data }
      const payload = (parsed && typeof parsed === 'object' && ('data' in parsed || 'success' in parsed))
        ? parsed
        : { success: true, data: parsed, raw: text };

      setAiResponse(payload);

      const data = payload.data;

      // If backend returned structured object, handle by mode
      if (data && typeof data === 'object') {
        // Title generation
        if (data.title && mode === 'title') {
          setTitle(String(data.title));
        }

        // Corrections (structured)
        if (data.corrected) {
          setCorrectedPreview(String(data.corrected));
        }
        if (Array.isArray(data.changes)) {
          setCorrectedWords(data.changes.map((c, i) => ({ index: c.index ?? i, from: c.from || '', to: c.to || '' })));
        }

        // Summary / shorten / expand / improve may return a 'summary' or plain text in 'text' key
        if (data.summary && (mode === 'summarize' || mode === 'shorten')) {
          setCorrectedPreview(String(data.summary));
        }
        if (data.text && typeof data.text === 'string' && !data.corrected) {
          setCorrectedPreview(data.text);
        }
      } else if (typeof data === 'string') {
        // Fallback: treat returned string as raw text
        const s = data;
        // extract first non-empty line
        const lines = s.split('\n').map(l => l.trim()).filter(Boolean);
        const short = lines.length ? lines[0] : s;
        setCorrectedPreview(short);

        // compute simple token diffs when in corrections mode
        if (mode === 'corrections') {
          const tokensOrig = (content || '').split(/\s+/).filter(Boolean);
          const tokensCorr = (short || '').split(/\s+/).filter(Boolean);
          const diffs = [];
          const len = Math.max(tokensOrig.length, tokensCorr.length);
          for (let i = 0; i < len; i++) {
            const o = tokensOrig[i] || '';
            const c = tokensCorr[i] || '';
            if (o !== c) diffs.push({ index: i, from: o, to: c });
          }
          setCorrectedWords(diffs);
        }
      }
    } catch (err) {
      // Detect network-level failures (e.g. backend not running, CORS/network)
      const msg = String(err?.message || err || 'Unknown error');
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('unable to connect')) {
        setError('Could not reach suggestion service. Showing local quick-fix instead.');

        // Apply a small client-side quick-fix so the UI still provides helpful output
        const clientFix = (txt) => {
          if (!txt) return '';
          let s = txt.trim();
          s = s.replace(/\bi\b/g, 'I');
          s = s.charAt(0).toUpperCase() + s.slice(1);
          if (!/[.!?]$/.test(s)) s += '.';
          return s;
        };

        const quick = clientFix(content);
        const fake = { data: { candidates: [{ content: { parts: [{ text: `Corrected text:\n"${quick}"` }] } }] } };
        setAiResponse(fake);
        setCorrectedPreview(quick);
        setCorrectedWords([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoadingAI(false);
    }
  };

  // Function: Extract correction text from AI response and apply to content
  const handleApplySuggestion = () => {
    if (!aiResponse || !aiResponse.data) {
      setError('No suggestion to apply');
      return;
    }

    try {
      // If backend returned structured object with 'corrected' or 'text', prefer that
      const payload = aiResponse.data;
      const toApply = correctedPreview || (payload && typeof payload === 'object' ? (payload.corrected || payload.text) : null) || aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!toApply) {
        setError('Could not extract correction text');
        return;
      }

      setContent(toApply);
      setAiResponse(null);
      setCorrectedPreview('');
      setCorrectedWords([]);
    } catch (err) {
      setError('Error applying suggestion: ' + err.message);
    }
  };

  // Apply only the simple word-level corrections (spelling changes)
  const handleApplySpelling = () => {
    if (!correctedWords || correctedWords.length === 0) {
      setError('No word-level corrections available');
      return;
    }

    const tokens = (content || '').split(/\s+/);
    correctedWords.forEach(({ index, to }) => {
      if (typeof index === 'number') {
        // only replace if a token exists at that index
        if (tokens[index] !== undefined && to) tokens[index] = to;
      }
    });

    const newContent = tokens.join(' ');
    setContent(newContent);
    setAiResponse(null);
    setCorrectedPreview('');
    setCorrectedWords([]);
  };

  // Function: Save the note to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem('token');
      const body = { title, content };

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Handle both JSON and plain text responses
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        throw new Error(data.message || `Error ${res.status}`);
      }

      // Navigate back to notes list after saving
      localStorage.setItem('showSticker', 'true');
      navigate('/notes');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };


  return (
    <div className="create-note-page">
      <h1>Create New Note</h1>
      <form onSubmit={handleSubmit} className="create-note-form">
        {/* Title input */}
        <div className="form-group">
          <label htmlFor="note-title">Title</label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-field"
            placeholder="Enter note title"
          />
        </div>

        {/* Content textarea with AI suggestion button */}
        <div className="form-group">
          <label htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="textarea-field"
            placeholder="Write your note here..."
            rows={8}
          />

          {/* AI Suggestion button */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
            <div className="ai-toolbar">
              <button
                type="button"
                className={`ai-feature-btn ${aiMode === 'summarize' ? 'active' : ''}`}
                onClick={() => setAiMode('summarize')}
                disabled={loadingAI || !content}
                title="Auto Summarize"
              >
                ✨ Auto Summarize
              </button>

              <button
                type="button"
                className={`ai-feature-btn ${aiMode === 'improve' ? 'active' : ''}`}
                onClick={() => setAiMode('improve')}
                disabled={loadingAI || !content}
                title="Improve Writing"
              >
                🧠 Improve Writing
              </button>

              <button
                type="button"
                className={`ai-feature-btn ${aiMode === 'title' ? 'active' : ''}`}
                onClick={() => setAiMode('title')}
                disabled={loadingAI || !content}
                title="Generate Title"
              >
                📌 Generate Title
              </button>

              <button
                type="button"
                className={`ai-feature-btn ${aiMode === 'shorten' ? 'active' : ''}`}
                onClick={() => setAiMode('shorten')}
                disabled={loadingAI || !content}
                title="Convert long → short"
              >
                🔎 Long → Short
              </button>

              <button
                type="button"
                className={`ai-feature-btn ${aiMode === 'expand' ? 'active' : ''}`}
                onClick={() => setAiMode('expand')}
                disabled={loadingAI || !content}
                title="Expand short → detailed"
              >
                📚 Expand
              </button>

              <button
                type="button"
                className="ai-btn"
                onClick={() => handleAISuggest(aiMode || 'corrections')}
                disabled={loadingAI || !content}
                title={`Run AI (${aiMode || 'corrections'})`}
              >
                {loadingAI ? "🔄 Generating..." : `✨ Run: ${aiMode || 'Corrections'}`}
              </button>
            </div>
          </div>
        </div>

        {/* AI Response Display */}
        {aiResponse && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#e3f2fd',
            border: '1px solid #2196F3',
            borderRadius: '8px'
          }}>
            <strong style={{ color: '#1976d2' }}>🤖 AI Suggestions:</strong>
            
            {/* Demo banner intentionally hidden to display only the corrected sentence */}

            {/* Display only the concise corrected sentence */}
            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: 'white',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '13px',
              color: '#333'
            }}>
              {correctedPreview || aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion available'}
            </div>

            {/* Apply and Dismiss buttons */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleApplySpelling}
                style={{
                  padding: '6px 12px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                title="Apply only the simple word-level corrections (spelling)"
              >
                ✍️ Apply Spelling Fixes
              </button>

              <button
                type="button"
                onClick={handleApplySuggestion}
                style={{
                  padding: '6px 12px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✓ Apply Professional Rewrite
              </button>

              <button
                type="button"
                onClick={() => { setAiResponse(null); setCorrectedPreview(''); setCorrectedWords([]); }}
                style={{
                  padding: '6px 12px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕ Dismiss
              </button>
            </div>

            {/* Show word-level corrections if present */}
            {correctedWords && correctedWords.length > 0 && (
              <div className="word-level-changes">
                <strong>Word-level changes:</strong>
                <ul>
                  {correctedWords.map((c, i) => {
                    const from = c.from || '—';
                    const toRaw = c.to || '—';
                    const to = toRaw === '—' ? toRaw : (/[.!?]$/.test(toRaw) ? toRaw : toRaw + '.');
                    return (
                      <li key={i}>{from} → <strong>{to}</strong></li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            borderLeft: '3px solid #c62828'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Save button */}
        <button type="submit" className="submit-btn" style={{ marginTop: '20px' }}>
          💾 Save Note
        </button>
      </form>
    </div>
  );
}

export default CreateNote;