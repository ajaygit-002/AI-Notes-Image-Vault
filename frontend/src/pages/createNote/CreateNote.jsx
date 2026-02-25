import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../components/style/createNote.css";

function CreateNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
        </div>


        <button type="submit" className="submit-btn">
          Save Note
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default CreateNote;
