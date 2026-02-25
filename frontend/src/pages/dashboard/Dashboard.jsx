import React, { useEffect, useState, useRef } from "react";
import "../../components/style/dashboard.css";
// chart library placeholder removed until installed

function Dashboard() {
  const [noteCount, setNoteCount] = useState(null);
  const [weeklyCount, setWeeklyCount] = useState(null);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/notes/stats', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          // not authorized, redirect to login
          window.location.href = '/login';
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          const msg = text || res.statusText;
          throw new Error(`Failed to load stats (${res.status}): ${msg}`);
        }
        const data = await res.json();
        setNoteCount(data.total);
        setWeeklyCount(data.weekly);

      } catch (err) {
        console.error('fetchStats error', err);
        setError(err.message);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {noteCount !== null ? (
        <div className="stats">
          <p>Total notes: {noteCount}</p>
          <p>Notes this week: {weeklyCount}</p>
        </div>
      ) : (
        <p>Loading statistics...</p>
      )}
    </div>
  );
}

export default Dashboard;
