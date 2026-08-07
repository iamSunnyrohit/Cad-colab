import React from "react";
import { PeerPresence, UserProfile } from "@cad-collab/shared";

export type Tool = "select" | "pan" | "line" | "circle" | "rectangle" | "measure";

interface Props {
  tool: Tool;
  zoom?: number;
  gridSnap?: boolean;
  objectCount?: number;
  currentUser?: UserProfile | null;
  canvasMode?: "2D" | "3D";
  extrudeDepth?: number;
  activeColor?: string;
  onChange: (tool: Tool) => void;
  onSave: () => void;
  onExport?: (format: "json" | "svg" | "png") => void;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleGridSnap?: () => void;
  onToggleCanvasMode?: () => void;
  onChangeExtrudeDepth?: (depth: number) => void;
  onChangeColor?: (color: string) => void;
  connectionStatus?: "connected" | "disconnected" | "reconnecting";
  peers?: PeerPresence[];
}

const COLOR_PALETTE = [
  "#2563eb", // Blue
  "#10b981", // Emerald
  "#ef4444", // Crimson
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f8fafc", // White
  "#ec4899"  // Pink
];

export function Toolbar({
  tool,
  zoom = 1,
  gridSnap = false,
  objectCount = 0,
  currentUser,
  canvasMode = "2D",
  extrudeDepth = 40,
  activeColor = "#2563eb",
  onChange,
  onSave,
  onExport,
  onNavigateHome,
  onSignOut,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGridSnap,
  onToggleCanvasMode,
  onChangeExtrudeDepth,
  onChangeColor,
  connectionStatus = "connected",
  peers = []
}: Props) {
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  return (
    <div style={{
      height: 52,
      backgroundColor: "#0b0f17",
      borderBottom: "1px solid #1f293d",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Brand & Menu Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          onClick={onNavigateHome}
          title="Back to Home Dashboard"
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "linear-gradient(135deg, #2563eb, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.9rem",
            color: "#ffffff"
          }}>
            📐
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc" }}>
            CAD Collab
          </span>
        </div>

        {/* Top Navigation Links */}
        <div style={{ display: "flex", gap: 16, fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
          <span style={{ cursor: "pointer", color: "#f8fafc" }}>File</span>
          <span style={{ cursor: "pointer" }}>Edit</span>
          <span style={{ cursor: "pointer", color: "#38bdf8", borderBottom: "2px solid #38bdf8", paddingBottom: 14 }}>View</span>
          <span style={{ cursor: "pointer" }}>Insert</span>
          <span style={{ cursor: "pointer" }}>Modify</span>
        </div>
      </div>

      {/* Center View Mode Switcher (Matching Image 3) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#161e2e",
        padding: 3,
        borderRadius: 8,
        border: "1px solid #1f293d"
      }}>
        <button
          onClick={() => canvasMode === "3D" && onToggleCanvasMode && onToggleCanvasMode()}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: canvasMode === "2D" ? "#1e293b" : "transparent",
            color: canvasMode === "2D" ? "#ffffff" : "#94a3b8",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          ✏️ Sketch
        </button>

        <button
          onClick={() => canvasMode === "2D" && onToggleCanvasMode && onToggleCanvasMode()}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: canvasMode === "3D" ? "#2563eb" : "transparent",
            color: canvasMode === "3D" ? "#ffffff" : "#94a3b8",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          🧊 3D Solid View
        </button>

        <button
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "transparent",
            color: "#64748b",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          ▦ Mesh
        </button>
      </div>

      {/* Right Controls (Share, Notifications, Settings, Profile) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Color Palette Swatches */}
        {onChangeColor && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", backgroundColor: "#161e2e", borderRadius: 6, border: "1px solid #1f293d" }}>
            {COLOR_PALETTE.map((c) => (
              <div
                key={c}
                onClick={() => onChangeColor(c)}
                title={`Select Color ${c}`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: c,
                  cursor: "pointer",
                  border: activeColor === c ? "2px solid #ffffff" : "1px solid rgba(0,0,0,0.3)",
                  transform: activeColor === c ? "scale(1.2)" : "scale(1)"
                }}
              />
            ))}
            <input
              type="color"
              value={activeColor}
              onChange={(e) => onChangeColor(e.target.value)}
              title="Custom Color Picker"
              style={{ width: 18, height: 18, border: "none", background: "none", cursor: "pointer", padding: 0 }}
            />
          </div>
        )}

        {/* Export CAD Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #1f293d",
              backgroundColor: "#161e2e",
              color: "#38bdf8",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            📥 Export ▾
          </button>
          {showExportMenu && (
            <div style={{
              position: "absolute",
              top: 36,
              right: 0,
              backgroundColor: "#161e2e",
              border: "1px solid #1f293d",
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              width: 170,
              overflow: "hidden",
              zIndex: 100
            }}>
              <div
                onClick={() => { setShowExportMenu(false); onExport && onExport("svg"); }}
                style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#f8fafc", cursor: "pointer", borderBottom: "1px solid #1f293d" }}
              >
                🖼️ Export SVG Vector
              </div>
              <div
                onClick={() => { setShowExportMenu(false); onExport && onExport("png"); }}
                style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#f8fafc", cursor: "pointer", borderBottom: "1px solid #1f293d" }}
              >
                📸 Export Image (.PNG)
              </div>
              <div
                onClick={() => { setShowExportMenu(false); onExport && onExport("json"); }}
                style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#f8fafc", cursor: "pointer" }}
              >
                💾 Export CAD JSON
              </div>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button style={{
          padding: "6px 16px",
          borderRadius: 6,
          border: "none",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          fontWeight: 600,
          fontSize: "0.85rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
        }}>
          Share
        </button>

        <span style={{ fontSize: "1.1rem", color: "#94a3b8", cursor: "pointer" }}>🔔</span>
        <span style={{ fontSize: "1.1rem", color: "#94a3b8", cursor: "pointer" }}>⚙️</span>

        {/* User Profile */}
        {currentUser ? (
          <div
            onClick={onSignOut}
            title={`${currentUser.username} (Click to Sign Out)`}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: currentUser.color || "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              border: "2px solid #1f293d"
            }}
          >
            {currentUser.username[0].toUpperCase()}
          </div>
        ) : (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "#1e293b",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem"
          }}>
            👤
          </div>
        )}
      </div>
    </div>
  );
}

// Left Vertical Tool Dock Component (Matching Image 2 & 3)
interface ToolDockProps {
  tool: Tool;
  onChange: (tool: Tool) => void;
}

export function ToolDock({ tool, onChange }: ToolDockProps) {
  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "select", label: "Select", icon: "📈" },
    { id: "line", label: "Line", icon: "📏" },
    { id: "circle", label: "Circle", icon: "⭕" },
    { id: "rectangle", label: "Rectangle", icon: "▭" },
    { id: "measure", label: "Measure Distance", icon: "📐" }
  ];

  return (
    <div style={{
      width: 48,
      backgroundColor: "#0e1420",
      borderRight: "1px solid #1f293d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "12px 0",
      gap: 12,
      zIndex: 20
    }}>
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.label}
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            border: tool === t.id ? "1px solid #3b82f6" : "1px solid transparent",
            backgroundColor: tool === t.id ? "#1e293b" : "transparent",
            color: tool === t.id ? "#38bdf8" : "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          {t.icon}
        </button>
      ))}

      <div style={{ width: 24, height: 1, backgroundColor: "#1f293d", margin: "4px 0" }} />

      <button title="Extrude 3D" style={{ width: 34, height: 34, borderRadius: 6, border: "none", backgroundColor: "transparent", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer" }}>
        🧊
      </button>
      <button title="Constraints" style={{ width: 34, height: 34, borderRadius: 6, border: "none", backgroundColor: "transparent", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer" }}>
        📐
      </button>
      <button title="Layers" style={{ width: 34, height: 34, borderRadius: 6, border: "none", backgroundColor: "transparent", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer" }}>
        📑
      </button>
      <button title="History" style={{ width: 34, height: 34, borderRadius: 6, border: "none", backgroundColor: "transparent", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer" }}>
        📜
      </button>
    </div>
  );
}
