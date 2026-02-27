import { useState, useEffect } from 'react'
import Login from './pages/login/login';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import ResetPassword from './pages/resetPassword/ResetPassword';
import Notes from './pages/notes/Notes.jsx';
import ComponentsPage from './pages/components/Components.jsx';
import CreateNote from './pages/createNote/CreateNote.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Profile from './pages/profile/Profile.jsx';
import ChangePassword from './pages/changePassword/ChangePassword.jsx';
import EditNote from './pages/editNote/EditNote';
import ImageVault from './pages/imageVault/ImageVault.jsx';
import ImageView from './pages/imageVault/ImageView.jsx';

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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* accept token as route param for reset page */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* legacy query param support, optional */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* protected routes wrapped in layout and require auth */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/tags/:tag" element={<Notes />} />
                  <Route path="/notes/create" element={<CreateNote />} />
                  <Route path="/notes/edit/:id" element={<EditNote />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/vault" element={<ImageVault />} />
                  <Route path="/vault/:id" element={<ImageView />} />
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
