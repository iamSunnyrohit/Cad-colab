import React, { useState } from "react";
import { UserProfile } from "@cad-collab/shared";
import { loginUser, registerUser } from "../net/authApi";

interface Props {
  onSuccess: (user: UserProfile) => void;
}

export function AuthModal({ onSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (!username.trim()) throw new Error("Please enter a username");
        const data = await registerUser({ username: username.trim(), email: email.trim(), password });
        onSuccess(data.user);
      } else {
        const data = await loginUser({ email: email.trim(), password });
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(17, 24, 39, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        width: 380,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        padding: "24px",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
          <button
            onClick={() => { setMode("login"); setError(null); }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              background: "none",
              borderBottom: mode === "login" ? "2px solid #2563eb" : "none",
              color: mode === "login" ? "#2563eb" : "#6b7280",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("register"); setError(null); }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              background: "none",
              borderBottom: mode === "register" ? "2px solid #2563eb" : "none",
              color: mode === "register" ? "#2563eb" : "#6b7280",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Create Account
          </button>
        </div>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 16px 0", color: "#111827", textAlign: "center" }}>
          {mode === "login" ? "Welcome back to CAD Collab" : "Create your CAD Collab Account"}
        </h2>

        {error && (
          <div style={{
            padding: "10px 12px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: 6,
            fontSize: "0.8rem",
            marginBottom: 16,
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alice"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: "0.85rem",
                  boxSizing: "border-box"
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: "0.85rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: "0.85rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "10px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontSize: "0.9rem"
            }}
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Register & Join"}
          </button>
        </form>
      </div>
    </div>
  );
}
