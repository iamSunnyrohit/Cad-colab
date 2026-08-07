import React from "react";
import { PeerPresence } from "@cad-collab/shared";

type Tool = "select" | "line" | "circle" | "rectangle";

interface Props {
  tool: Tool;
  onChange: (tool: Tool) => void;
  onSave: () => void;
  connectionStatus?: "connected" | "disconnected" | "reconnecting";
  peers?: PeerPresence[];
}

const tools: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "line", label: "Line" },
  { id: "circle", label: "Circle" },
  { id: "rectangle", label: "Rectangle" }
];

export function Toolbar({ tool, onChange, onSave, connectionStatus = "connected", peers = [] }: Props) {
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
            fontWeight: tool === t.id ? 600 : 400
          }}
        >
          {t.label}
        </button>
      ))}

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

      <button onClick={onSave} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
        Save snapshot
      </button>
    </div>
  );
}
