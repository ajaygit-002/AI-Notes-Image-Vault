import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../components/style/imageVault.css';

function ImageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/vault/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load item');
        setItem(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }
    load();
  }, [id]);

  if (error) {
    return <div className="vault-page">
      <button onClick={() => navigate(-1)} className="submit-btn">Back</button>
      <p className="vault-error">{error}</p>
    </div>;
  }

  if (!item) return <div className="vault-page"><p>Loading…</p></div>;

  return (
    <div className="vault-page vault-item-page">
      <button onClick={() => navigate(-1)} className="submit-btn">Back</button>
      <h1>{item.originalName}</h1>
      <div className="vault-item-container">
        <img src={`http://localhost:5000/uploads/${item.filename}`} alt={item.originalName} />
      </div>
    </div>
  );
}

export default ImageView;