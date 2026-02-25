import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../components/style/createNote.css";

function CreateNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem('token');
      let body = { title, content };
      if (image) {
        // convert to base64 for simple storage, real app would use FormData/upload endpoint
        const reader = new FileReader();
        body.image = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = err => reject(err);
          reader.readAsDataURL(image);
        });
      }
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

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
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

        <div className="form-group">
          <label htmlFor="note-image">Image</label>
          <input
            id="note-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="input-field"
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
