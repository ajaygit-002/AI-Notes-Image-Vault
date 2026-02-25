// src/components/layout/TopNavbar.jsx
import React from "react";
import "../style/navbar.css";

function TopNavbar({ toggleSidebar }) {
  const email = localStorage.getItem('userEmail') || '';
  // derive initials from email prefix
  const initials = email
    ? email
        .split('@')[0]
        .split(/[._]/)
        .map(n => n[0]?.toUpperCase())
        .join('')
    : 'U';

  return (
    <header className="top-navbar">
      <div className="left-section">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="logo">
          <div className="logo-circle">AI</div>
          <span>AI Notes & Image Vault</span>
        </div>
      </div>

      <div className="search-bar">
        <input type="text" placeholder="Search notes..." />
      </div>

      <div className="right-section">
        <button className="icon-btn">🌙</button>
        <div className="avatar">{initials}</div>
        <span className="username">{email}</span>
      </div>
    </header>
  );
}

export default TopNavbar;