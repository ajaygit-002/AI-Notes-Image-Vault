import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./editNote.css";

function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/notes`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const notes = await res.json();
        const note = notes.find(n => n._id === id);
        if (!note) throw new Error('Note not found');
        setTitle(note.title);
        setContent(note.content);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchNote();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      navigate('/notes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-note-page">
      <h1>Edit Note</h1>
      <form className="edit-note-form" onSubmit={handleSave}>
        <div className="input-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={6}
          />
        </div>
        <button
          className="save-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
}

export default EditNote;
