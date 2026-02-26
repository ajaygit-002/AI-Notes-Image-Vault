import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import "./dashboard.css"; // adjust import path as needed

const IconEdit = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

// ── Dashboard Component ────────────────────────────────
export default function Dashboard() {
  const [noteCount, setNoteCount] = useState(null);
  const [weeklyCount, setWeeklyCount] = useState(null);
  const [tagsCount, setTagsCount] = useState(null);
  const [error, setError] = useState(null);
  const [vaultError, setVaultError] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // check for any upload error passed from vault page
    const stored = localStorage.getItem('vaultUploadError');
    if (stored) {
      setVaultError(stored);
      localStorage.removeItem('vaultUploadError');
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/notes/stats", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) { window.location.href = "/login"; return; }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load stats (${res.status}): ${text || res.statusText}`);
        }
        const data = await res.json();
        setNoteCount(data.total);
        setWeeklyCount(data.weekly);
        setTagsCount(data.tags ?? 5);

        if (chartRef.current) {
          if (chartInstance.current) chartInstance.current.destroy();
          const labels = data.weeklyBreakdown?.labels ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const values = data.weeklyBreakdown?.values ?? [1, 3, 2, 5, 1, 4, 2];
          chartInstance.current = new Chart(chartRef.current, {
            type: "bar",
            data: {
              labels,
              datasets: [{
                label: "Notes created",
                data: values,
                backgroundColor: "rgba(108, 71, 255, 0.18)",
                borderColor: "rgba(108, 71, 255, 0.9)",
                borderWidth: 2,
                borderRadius: 6,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#aaa", font: { size: 11 } } },
                y: { beginAtZero: true, grid: { color: "#f0f0f7" }, ticks: { color: "#aaa", font: { size: 11 }, precision: 0 } },
              },
            },
          });
        }
      } catch (err) {
        console.error("fetchStats error", err);
        setError(err.message);
        setNoteCount(4); setWeeklyCount(2); setTagsCount(5);
        if (chartRef.current) {
          if (chartInstance.current) chartInstance.current.destroy();
          chartInstance.current = new Chart(chartRef.current, {
            type: "bar",
            data: {
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{
                label: "Notes created",
                data: [1, 0, 2, 1, 0, 2, 1],
                backgroundColor: "rgba(108, 71, 255, 0.18)",
                borderColor: "rgba(108, 71, 255, 0.9)",
                borderWidth: 2,
                borderRadius: 6,
              }],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#aaa", font: { size: 11 } } },
                y: { beginAtZero: true, grid: { color: "#f0f0f7" }, ticks: { color: "#aaa", font: { size: 11 }, precision: 0 } },
              },
            },
          });
        }
      }
    };
    fetchStats();
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  return (
    <div className="page-body">
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subheading">Welcome back! Here's an overview of your workspace.</p>

          {vaultError && (
            <div className="error-msg">⚠ {vaultError}</div>
          )}
          {error && (
            <div className="error-msg">⚠ {error} — showing sample data.</div>
          )}

          {/* Stat cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Notes</span>
              <span className="stat-value">{noteCount ?? "—"}</span>
              <span className="stat-sub">in your workspace</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">This Week</span>
              <span className="stat-value">{weeklyCount ?? "—"}</span>
              <span className="stat-sub">notes created</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tags</span>
              <span className="stat-value">{tagsCount ?? "—"}</span>
              <span className="stat-sub">categories</span>
            </div>
          </div>

          {/* Chart */}
          <div className="chart-card">
            <h2>Notes Activity — This Week</h2>
            <div className="chart-wrapper">
              <canvas ref={chartRef} />
            </div>
          </div>
    </div>
  );
}
