import React, { useState } from "react";
import { Link } from "react-router-dom";
import { parseJSON } from '../../utils/api';
import "../login/style/login.css"; // reuse login styles


function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: password
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    // Check if email exists before showing password fields
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: "dummy", confirmPassword: "dummy" }),
      });
      const data = await parseJSON(res);
      if (res.status === 404) throw new Error(data.message || "Email not registered");
      // If email exists, move to password step
      setStep(2);
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password, confirmPassword }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.message || "Request failed");
      setMessage(data.message || "Password has been reset.");
      setStep(3);
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

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} autoComplete="on">
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
                {loading ? "Checking..." : "Next"}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handlePasswordSubmit} autoComplete="on">
              <div className="input-group">
                <label htmlFor="password-input">New Password</label>
                <input
                  id="password-input"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirm-password-input">Confirm Password</label>
                <input
                  id="confirm-password-input"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
          {message && (
            <div style={{ color: "green", marginTop: 10, whiteSpace: "pre-wrap" }}>
              {message}
            </div>
          )}
          {step === 3 && message && (
            <div style={{ marginTop: 10, background: '#f0f0f0', padding: 10, borderRadius: 6 }}>
              <strong>{message}</strong>
              <div style={{ marginTop: 8, color: '#555' }}>
                You can now <Link to="/login">sign in</Link> with your new password.
              </div>
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
