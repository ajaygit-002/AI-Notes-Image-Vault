import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation();

  // read tag from path /tags/:tag or query
  const pathMatch = location.pathname.match(/\/tags\/(\w+)/);
  const tag = pathMatch ? pathMatch[1] : null;

  useEffect(() => {
    const fetchNotes = async () => {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load notes');
        setNotes(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchNotes();
  }, [tag]);

  return (
    <div className="notes-page">
      <h1>Notes {tag ? `#${tag}` : ''}</h1>
      {error && <p style={{color:'red'}}>{error}</p>}
      {notes.length === 0 && <p>No notes found.</p>}
      <ul>
        {notes.map(n => (
          <li key={n._id}>
            <h3>{n.title}</h3>
            <p>{n.content}</p>
            <small>{new Date(n.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notes;
