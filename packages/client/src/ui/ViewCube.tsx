import React from "react";

interface Props {
  canvasMode: "2D" | "3D";
  onResetZoom?: () => void;
  onSelectView?: (view: "TOP" | "FRONT" | "RIGHT" | "ISO") => void;
}

export function ViewCube({ canvasMode, onResetZoom, onSelectView }: Props) {
  return (
    <div style={{
      position: "absolute",
      top: 16,
      right: 16,
      width: 90,
      height: 90,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      borderRadius: 12,
      border: "1px solid #1f293d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 6,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      zIndex: 25,
      userSelect: "none"
    }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#38bdf8", marginBottom: 4, letterSpacing: "0.05em" }}>
        {canvasMode === "3D" ? "VIEWCUBE 3D" : "VIEWPORT"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, width: "100%" }}>
        <button
          onClick={() => { onResetZoom && onResetZoom(); onSelectView && onSelectView("TOP"); }}
          title="Top View (XY Plane)"
          style={{
            padding: "4px",
            fontSize: "0.65rem",
            fontWeight: 700,
            borderRadius: 4,
            border: "1px solid #1f293d",
            backgroundColor: "#161e2e",
            color: "#f8fafc",
            cursor: "pointer"
          }}
        >
          TOP
        </button>

        <button
          onClick={() => { onSelectView && onSelectView("FRONT"); }}
          title="Front View (ZX Plane)"
          style={{
            padding: "4px",
            fontSize: "0.65rem",
            fontWeight: 700,
            borderRadius: 4,
            border: "1px solid #1f293d",
            backgroundColor: "#161e2e",
            color: "#f8fafc",
            cursor: "pointer"
          }}
        >
          FRONT
        </button>

        <button
          onClick={() => { onSelectView && onSelectView("RIGHT"); }}
          title="Right View (YZ Plane)"
          style={{
            padding: "4px",
            fontSize: "0.65rem",
            fontWeight: 700,
            borderRadius: 4,
            border: "1px solid #1f293d",
            backgroundColor: "#161e2e",
            color: "#f8fafc",
            cursor: "pointer"
          }}
        >
          RIGHT
        </button>

        <button
          onClick={() => { onSelectView && onSelectView("ISO"); }}
          title="Isometric View"
          style={{
            padding: "4px",
            fontSize: "0.65rem",
            fontWeight: 700,
            borderRadius: 4,
            border: "1px solid #3b82f6",
            backgroundColor: "#1e3a8a",
            color: "#60a5fa",
            cursor: "pointer"
          }}
        >
          ISO
        </button>
      </div>
    </div>
  );
}
