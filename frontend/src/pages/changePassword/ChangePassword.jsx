/*
  frontend/src/pages/changePassword/ChangePassword.jsx
  Dedicated change-password page for authenticated users. Verifies the
  current password, posts the new password to the backend, and signs the
  user out after a successful change.
*/
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseJSON } from '../../utils/api';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <h1>Change Password</h1>
      {error && <div style={{color:'red', marginBottom:8}}>{error}</div>}
      {success && <div style={{color:'green', marginBottom:8}}>{success}</div>}
      <form onSubmit={handleSubmit} className="change-password-form">
        <label>Current Password</label>
        <input autoComplete="current-password" className="input-field" required type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
        <label>New Password</label>
        <input autoComplete="new-password" className="input-field" required minLength={6} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <label>Confirm New Password</label>
        <input autoComplete="new-password" className="input-field" required minLength={6} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
        <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Updating...' : 'Change Password'}</button>
      </form>
      <div className="change-password-actions">
        <button className="ai-btn" onClick={() => navigate('/forgot-password')}>Reset Password via Email</button>
      </div>
    </div>
  );
}
