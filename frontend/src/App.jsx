import { useState } from 'react'
import Login from './pages/login';
import Notes from './pages/notes/Notes';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/notes" element={<Notes />} />
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
