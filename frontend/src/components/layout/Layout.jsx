// src/components/layout/Layout.jsx
import React, { useState } from "react";
import TopNavbar from "./topnav.jsx";
import Sidebar from "./Sidebar.jsx";
import "../style/layout.css"; // style import fixed path

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <TopNavbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;