// src/components/layout/Sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/sidebar.css";

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateClick = () => {
    navigate("/notes/create");
    toggleSidebar(); // close on navigation if desired
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={toggleSidebar}
      ></div>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="create-btn" onClick={handleCreateClick}>
          + Create Note
        </button>

        <nav className="sidebar-nav-main">
          <ul>
            <li className={location.pathname === '/' ? 'active' : ''} onClick={() => { navigate('/'); toggleSidebar(); }}>
              🏠 Dashboard
            </li>
            <li className={location.pathname.startsWith('/notes') ? 'active' : ''} onClick={() => { navigate('/notes'); toggleSidebar(); }}>
              📄 All Notes
            </li>
            <li className={location.pathname === '/vault' ? 'active' : ''} onClick={() => { navigate('/vault'); toggleSidebar(); }}>
              🖼️ Image Vault
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className={location.pathname === '/profile' ? 'active' : ''} onClick={() => { navigate('/profile'); toggleSidebar(); }}>
            👤 Profile
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;