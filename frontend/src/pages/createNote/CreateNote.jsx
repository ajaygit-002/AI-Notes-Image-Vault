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
  
  const navigate = useNavigate();

  // Function: Call AI to get text corrections
  const handleAISuggest = async () => {
    setError("");
    setLoadingAI(true);
    setAiResponse(null);  // Clear previous response

    try {
      // Send the content to the backend API
      const res = await fetch('/api/notes/suggest-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI suggestion failed');
      }

      // Store the response to display it
      setAiResponse(data);

      // Extract a concise "corrected" sentence to show in the UI.
      // Many providers return a block of text that contains a "Corrected text:" section
      // (our local fallback uses that format). Try to extract that; otherwise fall back
      // to the first non-empty line of the AI response.
      const raw = data?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const extractCorrected = (s) => {
        if (!s) return '';
        // Look for 'Corrected text:' marker
        const match = s.match(/Corrected text:\s*"([\s\S]*?)"/i);
        if (match && match[1]) return match[1].trim();
        // Otherwise, take the first non-empty line as the short correction
        const lines = s.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.length ? lines[0] : s.trim();
      };

      setCorrectedPreview(extractCorrected(raw));

      // Compute simple word-level diffs between original content and the corrected preview
      const tokensOrig = (content || '').split(/\s+/).filter(Boolean);
      const tokensCorr = (extractCorrected(raw) || '').split(/\s+/).filter(Boolean);
      const diffs = [];
      const len = Math.max(tokensOrig.length, tokensCorr.length);
      for (let i = 0; i < len; i++) {
        const o = tokensOrig[i] || '';
        const c = tokensCorr[i] || '';
        if (o !== c) {
          diffs.push({ index: i, from: o, to: c });
        }
      }
      setCorrectedWords(diffs);
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
      const toApply = correctedPreview || aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
            <button 
              type="button" 
              className="ai-btn" 
              onClick={handleAISuggest} 
              disabled={loadingAI || !content}
            >
              {loadingAI ? "🔄 Generating corrections..." : "✨ Suggest Corrections"}
            </button>
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
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#444' }}>
                <strong>Word-level changes:</strong>
                <ul style={{ marginTop: '6px' }}>
                  {correctedWords.map((c, i) => (
                    <li key={i}>{c.from || '—'} → <strong>{c.to || '—'}</strong></li>
                  ))}
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