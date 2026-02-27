import React, { useEffect, useState } from "react";
import "./profile.css";
import { parseJSON } from '../../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
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
  }, []);

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      {error && <p className="profile-error">{error}</p>}
      {user ? (
        <div className="profile-info">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          {/* future fields such as notes count, vault usage could go here */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;
