import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../login/style/login.css"; // reuse login styles

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setMessage(
        "If an account with that email exists, a reset link was generated."
      );
      // for demo show clickable reset link
      if (data.resetLink) {
        setMessage(
          "If you're testing locally you can visit the link below:\n" +
            data.resetLink
        );
        // also set a separate state for link so we can render anchor
        setResetLink(data.resetLink);
      }
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
          <h2>Reset Password</h2>
          <p className="sub-text">
            Enter your email and we'll send a reset link
          </p>

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="input-group">
              <label htmlFor="email-input">Email</label>
              <input
                id="email-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
          {message && (
            <div style={{ color: "green", marginTop: 10, whiteSpace: "pre-wrap" }}>
              {message}
            </div>
          )}
          {resetLink && (
            <div style={{ marginTop: 10 }}>
              {/* use react-router Link so navigation stays in the SPA and opens in the same tab */}
              <Link to={resetLink.replace('http://localhost:5173', '')}>
                Open reset link
              </Link>
            </div>
          )}

          <p className="signup-text">
            Remembered password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
