import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function Login() {
  const { login, API_URL } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password, role: "admin" }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.token, data.userId);
        window.location.href = "/";
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Admin Login</h2>
        {error && (
          <p
            style={{ color: "red", textAlign: "center", marginBottom: "10px" }}
          >
            {error}
          </p>
        )}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email / Phone</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Login to Control Panel
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <p className="text-sm text-gray">
            Don't have an account?{" "}
            <Link to="/signup" className="link">
              Sign Up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
