import React, { useEffect, useState } from "react";
import { UserProfile } from "@cad-collab/shared";
import { listDocuments, createDocument } from "../net/api";
import { loginUser, registerUser } from "../net/authApi";

interface Props {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenDocument: (docId: string) => void;
  onAuthSuccess: (user: UserProfile) => void;
}

interface DocSummary {
  _id: string;
  name: string;
  version: number;
  objectCount: number;
  updatedAt?: string;
}

export function HomePage({ currentUser, onOpenAuth, onSignOut, onOpenDocument, onAuthSuccess }: Props) {
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Auth form state for left sidebar
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const data = await listDocuments();
      if (Array.isArray(data)) {
        setDocs(data);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreateNew = async () => {
    try {
      setCreating(true);
      const name = `Drawing ${docs.length + 1}`;
      const newDoc = await createDocument(name);
      if (newDoc && newDoc._id) {
        onOpenDocument(newDoc._id);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        const res = await registerUser({ username: username || "CAD User", email, password });
        onAuthSuccess(res.user);
      } else {
        const res = await loginUser({ email, password });
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      backgroundColor: "#0b0f17",
      color: "#f8fafc",
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        height: 48,
        backgroundColor: "#0b0f17",
        borderBottom: "1px solid #1f293d",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: "linear-gradient(135deg, #2563eb, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.8rem",
            color: "#ffffff"
          }}>
            📐
          </div>
          <span style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc" }}>
            CAD Collab
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981" }} />
            System Online
          </span>
          <span style={{ fontSize: "1rem", color: "#64748b", cursor: "pointer" }}>⚙️</span>
        </div>
      </header>

      {/* Main Body (Left Sidebar + Projects Workspace) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar (Matching Image 1 & Image 4) */}
        <aside style={{
          width: 260,
          backgroundColor: "#0e1420",
          borderRight: "1px solid #1f293d",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}>
          {/* New Project Button */}
          <button
            onClick={handleCreateNew}
            disabled={creating}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>+</span> New Project
          </button>

          {/* Workspace Menu */}
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 10 }}>
              WORKSPACE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                padding: "8px 12px",
                borderRadius: 6,
                backgroundColor: "#1e293b",
                borderLeft: "3px solid #3b82f6",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer"
              }}>
                <span>▦</span> Dashboard
              </div>
              <div style={{ padding: "8px 12px", color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span>📁</span> Personal
              </div>
              <div style={{ padding: "8px 12px", color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span>👥</span> Shared
              </div>
            </div>
          </div>

          {/* Teams Section */}
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 10 }}>
              TEAMS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ padding: "6px 12px", color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#f97316" }} />
                Team Alpha
              </div>
              <div style={{ padding: "6px 12px", color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#10b981" }} />
                Engineering Core
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* System Access / Auth Card (Matching Image 4) */}
          <div style={{
            backgroundColor: "#161e2e",
            borderRadius: 8,
            border: "1px solid #1f293d",
            padding: "16px"
          }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", marginBottom: 12 }}>
              {currentUser ? `User: ${currentUser.username}` : "System Access"}
            </div>

            {currentUser ? (
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                  {currentUser.email}
                </div>
                <button
                  onClick={onSignOut}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid #334155",
                    backgroundColor: "#0b0f17",
                    color: "#f8fafc",
                    fontSize: "0.75rem",
                    cursor: "pointer"
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {authError && (
                  <div style={{ color: "#ef4444", fontSize: "0.7rem" }}>{authError}</div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4, letterSpacing: "0.05em" }}>
                    EMAIL_ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@cadcollab.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 4, fontSize: "0.75rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4, letterSpacing: "0.05em" }}>
                    AUTHORIZATION_KEY
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 4, fontSize: "0.75rem" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    marginTop: 4,
                    padding: "8px",
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  {authLoading ? "Authenticating..." : "Initialize Session"}
                </button>
              </form>
            )}
          </div>
        </aside>

        {/* Right Dashboard Content */}
        <main style={{ flex: 1, backgroundColor: "#0b0f17", padding: "28px 36px", overflowY: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            {/* Header & Search */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 4px 0", color: "#f8fafc" }}>
                  System Overview
                </h1>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                  Last synced: {new Date().toLocaleTimeString()} UTC
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "1px solid #1f293d",
                    backgroundColor: "#161e2e",
                    color: "#f8fafc",
                    fontSize: "0.8rem",
                    width: 240
                  }}
                />
              </div>
            </div>

            {/* Active Nodes / Collaborators Section (Matching Image 4) */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 24, marginBottom: 32 }}>
              
              {/* Recent Projects Grid Header */}
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", marginBottom: 16 }}>
                  Recent Projects
                </div>

                {loading ? (
                  <div style={{ color: "#64748b", padding: "32px 0" }}>Loading project files...</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                    {filteredDocs.map((d) => (
                      <div
                        key={d._id}
                        style={{
                          backgroundColor: "#111827",
                          borderRadius: 8,
                          border: "1px solid #1f293d",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                        }}
                      >
                        {/* CAD Thumbnail Preview */}
                        <div style={{
                          height: 140,
                          backgroundColor: "#070a0f",
                          borderBottom: "1px solid #1f293d",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <span style={{ fontSize: "3rem", opacity: 0.25 }}>⚙️</span>
                          <span style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            padding: "2px 6px",
                            borderRadius: 10,
                            border: "1px solid rgba(16, 185, 129, 0.3)"
                          }}>
                            ● Live
                          </span>
                        </div>

                        {/* Card Content */}
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
                              {d.name}
                            </h3>
                            <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                              MODIFIED: 2024-10-24 ({d.objectCount} shapes)
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", gap: (-4) }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>
                                SJ
                              </div>
                            </div>

                            <button
                              onClick={() => onOpenDocument(d._id)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#38bdf8",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              Open →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Nodes Panel (Matching Image 4) */}
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", marginBottom: 16 }}>
                  Active Nodes
                </div>

                <div style={{
                  backgroundColor: "#161e2e",
                  borderRadius: 8,
                  border: "1px solid #1f293d",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#1e293b", color: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                        SJ
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f8fafc" }}>Sarah Jenkins</div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Lead Engineer</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "#10b981", fontWeight: 700 }}>● Live</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#1e293b", color: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                        MR
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f8fafc" }}>Mike Ross</div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Drafter</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "#f97316", fontWeight: 700 }}>● Idle</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#1e293b", color: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                        AT
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f8fafc" }}>Alex Chen</div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Simulation</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 500 }}>Offline</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Bottom Monospace Status Footer (Matching Image 1, 2, 3 & 4) */}
      <footer style={{
        height: 24,
        backgroundColor: "#070a0f",
        borderTop: "1px solid #1f293d",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        fontSize: "0.7rem",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#10b981"
      }}>
        <div>
          ● Connection: Live | Kernel: v1.0.4
        </div>
        <div style={{ color: "#64748b" }}>
          © 2024 Precision Systems. Units: Millimeters (ISO)
        </div>
      </footer>
    </div>
  );
}
