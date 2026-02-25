import React from "react";
import "./profile.css";

function Profile() {
  // sample user info pulled from localStorage or context
  const email = localStorage.getItem('userEmail') || 'user@example.com';

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <div className="profile-info">
        <p><strong>Email:</strong> {email}</p>
        {/* add additional profile fields */}
      </div>
    </div>
  );
}

export default Profile;
