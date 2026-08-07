import React from "react";
import { PeerPresence, UserProfile } from "@cad-collab/shared";

export type Tool = "select" | "pan" | "line" | "circle" | "rectangle";

interface Props {
  tool: Tool;
  zoom?: number;
  gridSnap?: boolean;
  objectCount?: number;
  currentUser?: UserProfile | null;
  onChange: (tool: Tool) => void;
  onSave: () => void;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleGridSnap?: () => void;
  connectionStatus?: "connected" | "disconnected" | "reconnecting";
  peers?: PeerPresence[];
}

const tools: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "pan", label: "Pan" },
  { id: "line", label: "Line" },
  { id: "circle", label: "Circle" },
  { id: "rectangle", label: "Rectangle" }
];

export function Toolbar({
  tool,
  zoom = 1,
  gridSnap = false,
  objectCount = 0,
  currentUser,
  onChange,
  onSave,
  onNavigateHome,
  onSignOut,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGridSnap,
  connectionStatus = "connected",
  peers = []
}: Props) {
  const getStatusBadge = () => {
    if (connectionStatus === "connected") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", backgroundColor: "#dcfce7", padding: "4px 8px", borderRadius: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} />
          Online
        </span>
      );
    }
    if (connectionStatus === "reconnecting") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#d97706", backgroundColor: "#fef3c7", padding: "4px 8px", borderRadius: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#d97706" }} />
          Reconnecting...
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#dc2626", backgroundColor: "#fee2e2", padding: "4px 8px", borderRadius: 12 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#dc2626" }} />
        Offline
      </span>
    );
  };

  return (
    <div style={{ height: 56, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
      {/* Dashboard Home Button */}
      {onNavigateHome && (
        <button
          onClick={onNavigateHome}
          title="Back to Home Dashboard"
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#f8fafc",
            color: "#1e293b",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          🏠 Dashboard
        </button>
      )}

      {onNavigateHome && <div style={{ width: 1, height: 24, backgroundColor: "#e5e7eb", margin: "0 4px" }} />}
      {/* CAD Tool selection */}
      <div style={{ display: "flex", gap: 4 }}>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: tool === t.id ? "#2563eb" : "white",
              color: tool === t.id ? "white" : "#111827",
              cursor: "pointer",
              fontWeight: tool === t.id ? 600 : 400,
              fontSize: "0.85rem"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: "#e5e7eb", margin: "0 4px" }} />

      {/* Grid Snapping & Viewport Controls */}
      <button
        onClick={onToggleGridSnap}
        title="Toggle 10px Grid Snapping"
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          background: gridSnap ? "#059669" : "#ffffff",
          color: gridSnap ? "#ffffff" : "#374151",
          cursor: "pointer",
          fontWeight: gridSnap ? 600 : 400,
          fontSize: "0.8rem"
        }}
      >
        Grid Snap: {gridSnap ? "ON" : "OFF"}
      </button>

      {/* Zoom controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, border: "1px solid #d1d5db", borderRadius: 6, overflow: "hidden", backgroundColor: "#ffffff" }}>
        <button onClick={onZoomOut} style={{ border: "none", background: "none", padding: "6px 8px", cursor: "pointer", fontSize: "0.85rem", color: "#374151" }}>-</button>
        <span onClick={onResetZoom} title="Reset zoom to 100%" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#111827", cursor: "pointer", minWidth: 44, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={onZoomIn} style={{ border: "none", background: "none", padding: "6px 8px", cursor: "pointer", fontSize: "0.85rem", color: "#374151" }}>+</button>
      </div>

      {/* Object stats */}
      <span style={{ fontSize: "0.75rem", color: "#6b7280", marginLeft: 4 }}>
        Shapes: {objectCount}
      </span>

      <div style={{ flex: 1 }} />

      {/* Connection status badge */}
      {getStatusBadge()}

      {/* Online collaborators avatar list */}
      {peers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, paddingRight: 8, borderRight: "1px solid #e5e7eb" }}>
          {peers.slice(0, 4).map((p) => (
            <div
              key={p.socketId}
              title={p.userName}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: p.color || "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "2px solid #ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              {p.userName ? p.userName[0].toUpperCase() : "U"}
            </div>
          ))}
          {peers.length > 4 && (
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginLeft: 4 }}>
              +{peers.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Authenticated user profile */}
      {currentUser && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: "1px solid #e5e7eb" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: currentUser.color || "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.8rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            {currentUser.username[0].toUpperCase()}
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>
            {currentUser.username}
          </span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sign out of your account"
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                borderRadius: 4,
                border: "1px solid #d1d5db",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      )}

      <button onClick={onSave} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
        Save snapshot
      </button>
    </div>
  );
}
