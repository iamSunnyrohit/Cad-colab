import React, { useState } from "react";
import { CanvasObject } from "../state/opQueue";
import { Constraint } from "@cad-collab/shared";

interface Props {
  objects: CanvasObject[];
  constraints: Constraint[];
  selectedObjectIds: string[];
  onSelectObject: (id: string) => void;
  canvasMode: "2D" | "3D";
  extrudeDepth: number;
}

export function FeatureTree({
  objects,
  constraints,
  selectedObjectIds,
  onSelectObject,
  canvasMode,
  extrudeDepth
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [sketchOpen, setSketchOpen] = useState(true);
  const [planesOpen, setPlanesOpen] = useState(false);
  const [extrudeOpen, setExtrudeOpen] = useState(true);
  const [constraintsOpen, setConstraintsOpen] = useState(true);

  return (
    <div style={{
      width: collapsed ? 36 : 240,
      backgroundColor: "#0d131f",
      borderRight: "1px solid #1f293d",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      color: "#f8fafc",
      fontSize: "0.8rem",
      fontFamily: "'Inter', -apple-system, sans-serif",
      transition: "width 0.2s ease",
      zIndex: 15
    }}>
      {/* Header Bar */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid #1f293d",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#090d15"
      }}>
        {!collapsed && (
          <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", color: "#38bdf8" }}>
            MODEL FEATURE TREE
          </span>
        )}
        <span
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Model Tree" : "Collapse Model Tree"}
          style={{ cursor: "pointer", color: "#64748b", fontSize: "0.9rem" }}
        >
          {collapsed ? "▶" : "◀"}
        </span>
      </div>

      {!collapsed && (
        <div style={{ padding: "10px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          
          {/* Document Root */}
          <div style={{ fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: 6, padding: "4px 6px" }}>
            <span>📦</span>
            <span>Assembly_Root.cad</span>
          </div>

          {/* Reference Planes Folder */}
          <div style={{ marginLeft: 10 }}>
            <div
              onClick={() => setPlanesOpen(!planesOpen)}
              style={{ cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}
            >
              <span>{planesOpen ? "▾" : "▸"}</span>
              <span>🌐 Reference Planes</span>
            </div>
            {planesOpen && (
              <div style={{ marginLeft: 16, display: "flex", flexDirection: "column", gap: 2, color: "#64748b", fontSize: "0.75rem" }}>
                <div>📐 XY Plane (Top)</div>
                <div>📐 YZ Plane (Right)</div>
                <div>📐 ZX Plane (Front)</div>
                <div>🎯 Coordinate Origin (0,0,0)</div>
              </div>
            )}
          </div>

          {/* 2D Sketch Folder */}
          <div style={{ marginLeft: 10 }}>
            <div
              onClick={() => setSketchOpen(!sketchOpen)}
              style={{ cursor: "pointer", color: "#38bdf8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}
            >
              <span>{sketchOpen ? "▾" : "▸"}</span>
              <span>✏️ Sketch_01 ({objects.length})</span>
            </div>
            {sketchOpen && (
              <div style={{ marginLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {objects.map((obj, i) => {
                  const isSel = selectedObjectIds.includes(obj._id || "");
                  return (
                    <div
                      key={obj._id || i}
                      onClick={() => obj._id && onSelectObject(obj._id)}
                      style={{
                        cursor: "pointer",
                        padding: "3px 6px",
                        borderRadius: 4,
                        backgroundColor: isSel ? "#1e293b" : "transparent",
                        color: isSel ? "#60a5fa" : "#cbd5e1",
                        fontWeight: isSel ? 700 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span>{obj.type === "line" ? "📈" : obj.type === "circle" ? "⭕" : "▭"}</span>
                      <span>{obj.type.toUpperCase()}_{obj._id ? obj._id.slice(0, 4) : i}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3D Extrusion Feature */}
          {canvasMode === "3D" && (
            <div style={{ marginLeft: 10 }}>
              <div
                onClick={() => setExtrudeOpen(!extrudeOpen)}
                style={{ cursor: "pointer", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}
              >
                <span>{extrudeOpen ? "▾" : "▸"}</span>
                <span>🧊 Solid_Extrude_01</span>
              </div>
              {extrudeOpen && (
                <div style={{ marginLeft: 16, color: "#94a3b8", fontSize: "0.75rem" }}>
                  <div>Depth: {extrudeDepth}mm</div>
                  <div>Operation: New Body</div>
                </div>
              )}
            </div>
          )}

          {/* Constraints Folder */}
          <div style={{ marginLeft: 10 }}>
            <div
              onClick={() => setConstraintsOpen(!constraintsOpen)}
              style={{ cursor: "pointer", color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}
            >
              <span>{constraintsOpen ? "▾" : "▸"}</span>
              <span>📐 Parametric Rules ({constraints.length})</span>
            </div>
            {constraintsOpen && (
              <div style={{ marginLeft: 16, display: "flex", flexDirection: "column", gap: 2, color: "#94a3b8", fontSize: "0.75rem" }}>
                {constraints.map((c) => (
                  <div key={c.id}>
                    ⊙ {c.kind} ({c.refs.length} refs)
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
