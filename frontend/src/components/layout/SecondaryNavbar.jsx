import React, { useState } from 'react';
import './navbar.css';

function SecondaryNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="secondary-navbar">
      <div className="nav-left">
        <span className="globe">🌐</span>
        <span className="brand">Wander</span>
      </div>
      <div className="nav-center">
        <a href="#" className="nav-link">Home</a>
        <a href="#" className="nav-link">Details</a>
        <a href="#" className="nav-link active">Destination</a>
        <a href="#" className="nav-link">Services</a>
        <a href="#" className="nav-link">Contact</a>
      </div>
      <div className="nav-right">
        <button className="btn outline">My Trips</button>
        <button className="btn filled">Create Trip</button>
        <button className="btn filled small">Login</button>
      </div>

      <button className="hamburger" onClick={toggleMenu}>☰</button>
      {menuOpen && (
        <div className="mobile-dropdown">
          <div className="mobile-links">
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link">Details</a>
            <a href="#" className="nav-link active">Destination</a>
            <a href="#" className="nav-link">Services</a>
            <a href="#" className="nav-link">Contact</a>
          </div>
          <div className="mobile-buttons">
            <button className="btn outline full">My Trips</button>
            <button className="btn filled full">Create Trip</button>
            <button className="btn filled small full">Login</button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default SecondaryNavbar;
