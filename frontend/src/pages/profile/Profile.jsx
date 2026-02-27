import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./profile.css";
import { parseJSON } from '../../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          navigate('/login');
          return;
        }
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          try { const body = await parseJSON(res); setError(body.message || 'Unauthorized'); } catch (e) { setError('Unauthorized'); }
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const data = await parseJSON(res);
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load profile');
        }
        setUser(data.user);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setChanging(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setSuccess(data.message || 'Password updated');
      localStorage.removeItem('token');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally { setChanging(false); }
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      {error && <p className="profile-error">{error}</p>}
      {user ? (
        <>
          <div className="profile-info">
            <p><strong>Email:</strong> {user.email}</p>
            {user.createdAt && (() => {
              const d = new Date(user.createdAt);
              if (!isNaN(d.getTime())) return <p><strong>Member since:</strong> {d.toLocaleDateString()}</p>;
              return null;
            })()}
          </div>

          <div style={{marginTop:20, maxWidth:480}}>
            <h2>Change Password</h2>
            <div style={{marginBottom:10}}>
              <button className="ai-btn" onClick={() => navigate('/change-password')}>Change Password</button>
            </div>
            <div>
              <button className="ai-btn" onClick={() => navigate('/forgot-password')}>Reset Password via Email</button>
            </div>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;
