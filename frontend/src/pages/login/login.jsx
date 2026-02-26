import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style/login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      setSuccess("Login successful!");
      window.alert("Login successful!");
      // save token and email locally for dashboard/nav
      localStorage.setItem('userEmail', email);
      if (typeof onLogin === 'function') onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="main-container">
      {/* LEFT SIDE */}
      <div className="left-section">
        <div className="left-content">
          <div className="logo-box">✨</div>
          <h1>AI Notes & Image Vault</h1>
          <p>
            Your intelligent workspace for notes and <br />
            images powered by AI
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-section">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="sub-text">Sign in to continue to your workspace</p>

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="input-group">
              <label htmlFor="email-input">Email</label>
              <input
                id="email-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type="password"
                placeholder="Enter your password"
                className="password-input clean-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="options">
              <div>
                <input type="checkbox" /> Remember me
              </div>
              <Link to="/forgot-password" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Forgot password
              </Link>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
          {/* Success message is now shown as a popup */}

          <p className="signup-text">
            Don't have an account? <span>Create Account</span>
          </p>
        </div>
      </div>
      </div>
    );
  }

  export default Login