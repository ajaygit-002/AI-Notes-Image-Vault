import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { parseJSON } from '../../utils/api';
import './notes.css';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // read tag from path /tags/:tag or query
  const pathMatch = location.pathname.match(/\/tags\/(\w+)/);
  const tag = pathMatch ? pathMatch[1] : null;

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/notes';
        if (tag) {
          url += `?tag=${tag}`;
        }
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.message || 'Failed to load notes');
        setNotes(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [tag]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (id) => {
    const newTitle = prompt('Edit title:');
    const newContent = prompt('Edit content:');
    if (!newTitle && !newContent) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.message || 'Edit failed');
      setNotes(notes.map(n => n._id === id ? data : n));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="notes-page">
      <h1>Notes {tag ? `#${tag}` : ''}</h1>
      {error && <p style={{color:'red'}}>{error}</p>}
      
      {loading ? (
        <div className="loading-state">
           <div className="spinner"></div>
           <p>Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📝 No notes found. Create your first note!</p>
          <button className="submit-btn" style={{ padding: '8px 16px', fontSize: '1rem' }} onClick={() => navigate('/notes/create')}>Create Note</button>
        </div>
      ) : (
        <div className="notes-container">
          {notes.map(n => (
            <div className="note-card" key={n._id}>
              <div className="note-title">{n.title}</div>
              <div className="note-content">{n.content}</div>
              <div className="note-date">{new Date(n.createdAt).toLocaleString()}</div>
              <div className="note-actions">
                <button className="note-edit-btn" title="Edit" onClick={() => navigate(`/notes/edit/${n._id}`)}>Edit</button>
                <button className="note-delete-btn" title="Delete" onClick={() => handleDelete(n._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notes;
