import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../login/style/login.css"; // reuse login styles

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // always show form; backend handles token validity
  // if the token is missing we will redirect back to forgot-password quickly
  React.useEffect(() => {
    if (!token) {
      setError("Token not provided in URL");
      // give user a moment to see the message and then send them back
      const t = setTimeout(() => {
        navigate('/forgot-password');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      // show which account was updated so user can verify
      if (data.user && data.user.email) {
        setMessage(`Password for ${data.user.email} updated. Redirecting to login...`);
      } else {
        setMessage("Password updated. Redirecting to login...");
      }
      console.log('reset response', data);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const msg = err.message || '';
      setError(msg);
      // if backend says the token is bad, send user back to request a new link
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setTimeout(() => {
          navigate('/forgot-password');
        }, 1500);
      }
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
          <h2>Change Password</h2>
          <p className="sub-text">Choose a new password for your account</p>

          <form onSubmit={handleSubmit} autoComplete="on">
            {/* hidden username field for accessibility/credential managers */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className="input-group">
              <label htmlFor="password-input">New Password</label>
              <input
                id="password-input"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirm-input">Confirm Password</label>
              <input
                id="confirm-input"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Set Password"}
            </button>
          </form>

          {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
          {message && <div style={{ color: "green", marginTop: 10 }}>{message}</div>}

          <p className="signup-text">
            <Link to="/login">Return to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
