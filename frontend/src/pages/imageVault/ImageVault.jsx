import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseJSON } from '../../utils/api';
import '../../components/style/imageVault.css';

function ImageVault() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState([]);

  const checkPassword = (e) => {
    e.preventDefault();
    setError('');
    // simple client-side gate; backend will re-check on upload
    if (password === '1234') {
      setAuthorized(true);
      setPassword(''); // clear out the field
    } else {
      setError('Incorrect password');
    }
  };

  // helper to fetch vault items
  const loadItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/vault');
      const data = await parseJSON(res);
      if (res.ok) {
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadItems();
    }
  }, [authorized]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Please select an image to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('password', '1234'); // always send correct password since we've already gated, backend still cares
      formData.append('image', file);

      const res = await fetch('http://localhost:5000/api/vault/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await parseJSON(res);
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage('Upload successful!');
      setFile(null);
      // reload gallery items so new image appears
      loadItems();
      // navigate to the new image page if item id returned
      if (data.item && data.item._id) {
        navigate(`/vault/${data.item._id}`);
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Upload failed';
      setError(msg);
    }
  };

  return (
    <div className="vault-page">
      <h1>Image Vault</h1>

      {!authorized ? (
        /* password entry form */
        <form onSubmit={checkPassword} className="vault-form">
          <div className="form-group">
            <label htmlFor="vault-password">Password</label>
            <input
              id="vault-password"
              type="password"
              value={password || ''}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <button type="submit" className="submit-btn">
            Enter
          </button>
        </form>
      ) : (
        /* upload form after authorization */
        <form onSubmit={handleSubmit} className="vault-form">
          <div className="form-group">
            <label htmlFor="vault-file">Select image</label>
            <input
              id="vault-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="input-field"
            />
          </div>
          <button type="submit" className="submit-btn">
            Upload
          </button>
        </form>
      )}

      {error && <p className="vault-error">{error}</p>}
      {message && <p className="vault-message">{message}</p>}

      {authorized && items.length > 0 && (
        <div className="vault-gallery">
          {items.map(item => (
            <div key={item._id} className="vault-item" onClick={() => navigate(`/vault/${item._id}`)}>
              <img src={`http://localhost:5000/uploads/${item.filename}`} alt={item.originalName} />
              <div className="vault-item-name">{item.originalName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageVault;