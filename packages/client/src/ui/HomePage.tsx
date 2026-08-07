import React, { useEffect, useState } from "react";
import { UserProfile } from "@cad-collab/shared";
import { listDocuments, createDocument } from "../net/api";

interface Props {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenDocument: (docId: string) => void;
}

interface DocSummary {
  _id: string;
  name: string;
  version: number;
  objectCount: number;
  updatedAt?: string;
}

export function HomePage({ currentUser, onOpenAuth, onSignOut, onOpenDocument }: Props) {
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDocName, setNewDocName] = useState("");

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
      const name = newDocName.trim() || `CAD Drawing ${docs.length + 1}`;
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

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Header */}
      <header style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid #1e293b",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "#ffffff",
            boxShadow: "0 0 15px rgba(37, 99, 235, 0.4)"
          }}>
            📐
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.025em", background: "linear-gradient(135deg, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CAD Collab
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 12px", backgroundColor: "#1e293b", borderRadius: 20, border: "1px solid #334155" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: currentUser.color || "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                {currentUser.username[0].toUpperCase()}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>{currentUser.username}</span>
              <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", marginLeft: 4 }}>
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #3b82f6",
                backgroundColor: "transparent",
                color: "#60a5fa",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Sign In / Register
            </button>
          )}

          <button
            onClick={handleCreateNew}
            disabled={creating}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
            }}
          >
            + New Drawing
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "64px 32px 48px 32px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 20,
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          color: "#60a5fa",
          fontSize: "0.8rem",
          fontWeight: 600,
          marginBottom: 20
        }}>
          ⚡ Powered by Operational Transformation & Gauss-Newton Solver
        </div>

        <h1 style={{
          fontSize: "3.2rem",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          margin: "0 0 20px 0",
          background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #60a5fa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Real-Time Collaborative 2D Parametric CAD Engine
        </h1>

        <p style={{ fontSize: "1.15rem", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 32px 0", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          Design 2D geometric CAD sketches collaboratively with non-blocking Operational Transformation (OT), real-time peer cursor presence, and live geometric constraints.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <button
            onClick={handleCreateNew}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)"
            }}
          >
            Launch CAD Canvas
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: "0 32px 64px 32px", maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <div style={{ padding: "20px", backgroundColor: "#1e293b", borderRadius: 12, border: "1px solid #334155" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>🔄</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Operational Transformation</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Lock-free concurrent editing engine resolving shape movement & constraint transforms simultaneously.
            </p>
          </div>

          <div style={{ padding: "20px", backgroundColor: "#1e293b", borderRadius: 12, border: "1px solid #334155" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>📐</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Geometric Constraint Engine</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Enforce Parallel, Perpendicular, Coincident, and Distance rules via Web Worker iterative solver.
            </p>
          </div>

          <div style={{ padding: "20px", backgroundColor: "#1e293b", borderRadius: 12, border: "1px solid #334155" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>👥</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Live Peer Presence</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Real-time collaborator avatars, name badges, selection highlights, and auto-catchup reconnection.
            </p>
          </div>

          <div style={{ padding: "20px", backgroundColor: "#1e293b", borderRadius: 12, border: "1px solid #334155" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>⚡</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>2D Spatial Culling & Snapping</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Bounding-box spatial indexing for high-FPS viewport culling, pan & zoom, and 10px CAD grid snapping.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Dashboard Section */}
      <section style={{ flex: 1, backgroundColor: "#020617", borderTop: "1px solid #1e293b", padding: "48px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0", color: "#f8fafc" }}>Drawing Projects Dashboard</h2>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Select a drawing document to launch the collaborative CAD editor</p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <input
                type="text"
                placeholder="Search drawings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #334155",
                  backgroundColor: "#0f172a",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  width: 220
                }}
              />

              <button
                onClick={handleCreateNew}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                + Create Drawing
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading drawing documents...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {/* Create New Card */}
              <div
                onClick={handleCreateNew}
                style={{
                  padding: "24px",
                  borderRadius: 12,
                  border: "2px dashed #334155",
                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  minHeight: 160,
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#1e293b", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>
                  +
                </div>
                <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem" }}>Create Blank Drawing</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>Start a new 2D parametric sketch</span>
              </div>

              {/* Document Cards */}
              {filteredDocs.map((d) => (
                <div
                  key={d._id}
                  style={{
                    padding: "20px",
                    borderRadius: 12,
                    border: "1px solid #1e293b",
                    backgroundColor: "#0f172a",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 160,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "2px 8px", borderRadius: 10 }}>
                        v{d.version}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {d.objectCount} shapes
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
                      {d.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => onOpenDocument(d._id)}
                    style={{
                      marginTop: 16,
                      padding: "8px 14px",
                      borderRadius: 6,
                      border: "1px solid #3b82f6",
                      backgroundColor: "rgba(37, 99, 235, 0.1)",
                      color: "#60a5fa",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    Open Canvas →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
