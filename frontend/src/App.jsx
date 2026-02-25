import { useState, useEffect } from 'react'
import Login from './pages/login/login';
import Notes from './pages/notes/Notes.jsx';
import ComponentsPage from './pages/components/Components.jsx';
import CreateNote from './pages/createNote/CreateNote.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Profile from './pages/profile/Profile.jsx';

import TopNavbar from './components/layout/topnav.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Layout from './components/layout/Layout.jsx';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';


function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />

        {/* protected routes wrapped in layout and require auth */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/notes/create" element={<CreateNote />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/components" element={<ComponentsPage />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function LoginWrapper() {
  const navigate = useNavigate();
  return <Login onLogin={token => {
    localStorage.setItem('token', token);
    navigate('/notes');
  }} />;
}

export default App
