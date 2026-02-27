import React, { useState } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import { parseJSON } from '../../utils/api';
import "../login/style/login.css"; // reuse login styles

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const { token: paramToken } = useParams();
  const token = paramToken || searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // always show form; backend handles token validity
  // if the token is missing we will redirect back to forgot-password quickly

  React.useEffect(() => {
    if (!token) {
      setError("Token not provided in URL");
      const t = setTimeout(() => {
        navigate('/forgot-password');
      }, 1500);
      return () => clearTimeout(t);
    }

    // verify token with backend before showing form
    const check = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await parseJSON(res);
        if (data.valid) {
          setValidToken(true);
        } else {
          setError("Password reset link is invalid or has expired.");
          setValidToken(false);
          setTimeout(() => navigate('/forgot-password'), 1500);
        }
      } catch (err) {
        console.error("token check failed", err);
        setError("Unable to verify reset link. Please try again.");
      }
    };
    check();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid request – missing token. Redirecting...");
      setTimeout(() => navigate('/forgot-password'), 1500);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password, confirmPassword: confirm }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.message || "Request failed");
      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const msg = err.message || '';
      setError(msg);
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
            <div className="input-group" style={{ position: 'relative' }}>
              <label htmlFor="password-input">New Password</label>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="password-input"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <span
                className="toggle-password-eye"
                onClick={() => setShowPassword(p => !p)}
              >{showPassword ? '🙈' : '👁️'}</span>
              {password && password.length < 6 && (
                <div style={{ color: 'red', fontSize: '0.8rem' }}>
                  Password must be at least 6 characters
                </div>
              )}
            </div>
            <div className="input-group" style={{ position: 'relative' }}>
              <label htmlFor="confirm-input">Confirm Password</label>
              <input
                id="confirm-input"
                type={showConfirm ? 'text' : 'password'}
                className="password-input"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              <span
                className="toggle-password-eye"
                onClick={() => setShowConfirm(p => !p)}
              >{showConfirm ? '🙈' : '👁️'}</span>
              {confirm && password !== confirm && (
                <div style={{ color: 'red', fontSize: '0.8rem' }}>
                  Passwords do not match
                </div>
              )}
            </div>

                  <button
              className="login-btn"
              type="submit"
              disabled={
                loading || !token || !validToken ||
                password.length < 6 || password !== confirm
              }
            >
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
