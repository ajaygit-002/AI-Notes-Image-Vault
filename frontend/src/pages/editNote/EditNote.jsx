import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../components/style/createNote.css"; // Reuse the styling

function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // AI State
  const [aiResponse, setAiResponse] = useState(null);
  const [correctedPreview, setCorrectedPreview] = useState('');
  const [correctedWords, setCorrectedWords] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMode, setAiMode] = useState('corrections');

  const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE || 'http://localhost:5000') : (import.meta.env.VITE_API_BASE || '');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/notes`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const text = await res.text();
        let notes;
        try { notes = JSON.parse(text); } catch { notes = []; }
        
        const note = Array.isArray(notes) ? notes.find(n => n && n._id === id) : null;
        if (!note) throw new Error('Note not found');
        setTitle(note.title);
        setContent(note.content);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchNote();
  }, [id, API_BASE]);

  const handleAISuggest = async (mode = 'corrections') => {
    setError("");
    setLoadingAI(true);
    setAiResponse(null);
    setAiMode(mode);

    try {
      const res = await fetch(`${API_BASE}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ content, type: mode }),
      });

      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }

      if (!res.ok) {
        const errMsg = parsed.message || (typeof parsed === 'string' ? parsed : 'AI suggestion failed');
        throw new Error(errMsg);
      }

      const payload = (typeof parsed === 'object' && ('data' in parsed || 'success' in parsed)) ? parsed : { success: true, data: parsed };
      setAiResponse(payload);

      const data = payload.data;
      if (data && typeof data === 'object') {
        if (data.title && mode === 'title') setTitle(String(data.title));
        if (data.corrected) setCorrectedPreview(String(data.corrected));
        if (Array.isArray(data.changes)) {
          setCorrectedWords(data.changes.map((c, i) => ({ index: c.index ?? i, from: c.from || '', to: c.to || '' })));
        }
        if (data.summary && (mode === 'summarize' || mode === 'shorten')) setCorrectedPreview(String(data.summary));
        if (data.text && typeof data.text === 'string' && !data.corrected) setCorrectedPreview(data.text);
      } else if (typeof data === 'string') {
        const s = data;
        const lines = s.split('\n').map(l => l.trim()).filter(Boolean);
        const short = lines.length ? lines[0] : s;
        setCorrectedPreview(short);

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
      setError(err.message || 'Error occurred while contacting AI service.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!aiResponse || !aiResponse.data) return;
    const toApply = correctedPreview || aiResponse.data?.text || aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (toApply) {
      setContent(toApply);
      setAiResponse(null);
      setCorrectedPreview('');
      setCorrectedWords([]);
    }
  };

  const handleApplySpelling = () => {
    if (!correctedWords || !correctedWords.length) return;
    const tokens = (content || '').split(/\s+/);
    correctedWords.forEach(({ index, to }) => {
      if (typeof index === 'number' && tokens[index] !== undefined && to) tokens[index] = to;
    });
    setContent(tokens.join(' '));
    setAiResponse(null);
    setCorrectedPreview('');
    setCorrectedWords([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }
      if (!res.ok) throw new Error(data.message || 'Save failed');
      navigate('/notes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-note-page">
      <h1>Edit Note</h1>
      <form className="create-note-form" onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="input-field"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Enter note title"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            className="textarea-field"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={8}
            placeholder="Write your note here..."
          />
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
            <div className="ai-toolbar">
              <button type="button" className={`ai-feature-btn ${aiMode === 'summarize' ? 'active' : ''}`} onClick={() => handleAISuggest('summarize')} disabled={loadingAI || !content}>✨ Auto Summarize</button>
              <button type="button" className={`ai-feature-btn ${aiMode === 'improve' ? 'active' : ''}`} onClick={() => handleAISuggest('improve')} disabled={loadingAI || !content}>🧠 Improve Writing</button>
              <button type="button" className={`ai-feature-btn ${aiMode === 'title' ? 'active' : ''}`} onClick={() => handleAISuggest('title')} disabled={loadingAI || !content}>📌 Generate Title</button>
              <button type="button" className={`ai-feature-btn ${aiMode === 'shorten' ? 'active' : ''}`} onClick={() => handleAISuggest('shorten')} disabled={loadingAI || !content}>🔎 Long → Short</button>
              <button type="button" className="ai-btn" onClick={() => handleAISuggest(aiMode || 'corrections')} disabled={loadingAI || !content}>
                {loadingAI ? "🔄 Generating..." : `✨ Run: ${aiMode || 'Corrections'}`}
              </button>
            </div>
          </div>
        </div>

        {aiResponse && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#e3f2fd', border: '1px solid #2196F3', borderRadius: '8px' }}>
            <strong style={{ color: '#1976d2' }}>🤖 AI Suggestions:</strong>
            <div style={{ marginTop: '12px', padding: '8px', background: 'white', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', color: '#333' }}>
              {correctedPreview || aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion available'}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleApplySpelling} style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>✍️ Apply Spelling Fixes</button>
              <button type="button" onClick={handleApplySuggestion} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>✓ Apply Professional Rewrite</button>
              <button type="button" onClick={() => { setAiResponse(null); setCorrectedPreview(''); setCorrectedWords([]); }} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>✕ Dismiss</button>
            </div>
             {correctedWords && correctedWords.length > 0 && (
              <div className="word-level-changes">
                <strong>Word-level changes:</strong>
                <ul>
                  {correctedWords.map((c, i) => (
                    <li key={i}>{c.from || '—'} → <strong>{c.to || '—'}</strong></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '12px', padding: '8px', background: '#ffebee', color: '#c62828', borderRadius: '4px', borderLeft: '3px solid #c62828' }}>
            ❌ {error}
          </div>
        )}

        <button className="submit-btn" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default EditNote;
