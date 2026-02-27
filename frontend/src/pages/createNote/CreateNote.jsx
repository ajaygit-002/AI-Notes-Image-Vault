import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../components/style/createNote.css";

function CreateNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const navigate = useNavigate();
  // AI suggestion handler
  const handleAISuggest = async () => {
    setError("");
    setLoadingAI(true);
    setSuggestions([]);
    // show sticker on button when action starts
    setShowSticker(true);
    // auto-hide sticker after 3.5s
    setTimeout(() => setShowSticker(false), 3500);
    try {
      const res = await fetch('http://localhost:5000/api/notes/suggest-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI suggestion failed');
      setSuggestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem('token');
      const body = { title, content };
      const res = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      // handle non-JSON responses gracefully
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
      // signal navbar to show AI sticker next time it renders
      localStorage.setItem('showSticker','true');
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
        <div className="form-group">
          <label htmlFor="note-title">Title</label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-field"
          />
        </div>

        <div className="form-group">
          <label htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="textarea-field"
          />
          <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
            <button type="button" className="ai-btn" onClick={handleAISuggest} disabled={loadingAI || !content} style={{position:'relative'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6"/><path d="M6 8h12"/><path d="M6 12h12"/></svg>
              {loadingAI ? "Generating..." : "Suggest Corrections"}
              {showSticker && (
                <span className="ai-sticker" aria-hidden>🤖</span>
              )}
            </button>
          </div>
        </div>


        <button type="submit" className="submit-btn">
          Save Note
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {suggestions.length > 0 && (
        <div className="ai-suggestions" style={{marginTop:16, background:'#f7f7ff', borderRadius:8, padding:12}}>
          <strong>AI Suggestions:</strong>
          <ul style={{marginTop:8}}>
            {suggestions.map((s, idx) => (
              <li key={idx} style={{marginBottom:6}}>
                <span style={{color:'#d32f2f'}}>{s.message}</span>
                {s.replacements && s.replacements.length > 0 && (
                  <span style={{marginLeft:8, color:'#1976d2'}}>Suggestion: {s.replacements.map(r => r.value).join(', ')}</span>
                )}
                <span style={{marginLeft:8, color:'#888'}}>Context: "{s.context.text}"</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CreateNote;
