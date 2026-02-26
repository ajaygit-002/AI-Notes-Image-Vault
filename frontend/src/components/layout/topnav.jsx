// src/components/layout/TopNavbar.jsx
import React, { useState, useEffect } from "react";
import "../style/navbar.css";

function TopNavbar() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );
  const [stickerUrl, setStickerUrl] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // check for sticker flag when component mounts
  useEffect(() => {
    if (localStorage.getItem('showSticker') === 'true') {
      // generate/choose a URL for AI sticker; using placeholder for demo
      setStickerUrl('https://via.placeholder.com/32?text=🤖');
      localStorage.removeItem('showSticker');

      // clear sticker after a few seconds automatically
      setTimeout(() => setStickerUrl(null), 5000);
    }
  }, []);

  return (
    <header className="top-navbar simple">
      <div className="title">
        AI Notes & Image Vault
        {stickerUrl && <img src={stickerUrl} alt="AI sticker" style={{marginLeft:'8px',verticalAlign:'middle'}} />}
      </div>
      <button
        className="theme-btn"
        aria-label="Toggle light/dark mode"
        onClick={() => setDark(d => !d)}
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}

export default TopNavbar;