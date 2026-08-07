import React from "react";
import { CanvasObject } from "../state/opQueue";
import { Constraint } from "@cad-collab/shared";

interface Props {
  canvasMode: "2D" | "3D";
  selectedObjectIds: string[];
  selectedPoints: string[];
  objects: CanvasObject[];
  constraints: Constraint[];
  extrudeDepth: number;
  onAddConstraint: (kind: "coincident" | "parallel" | "perpendicular" | "fixedDistance") => void;
  onRemoveConstraint: (id: string) => void;
  onChangeExtrudeDepth: (depth: number) => void;
}

export function Sidebar({
  canvasMode,
  selectedObjectIds,
  selectedPoints,
  objects,
  constraints,
  extrudeDepth,
  onAddConstraint,
  onRemoveConstraint,
  onChangeExtrudeDepth
}: Props) {
  const selectedObj = objects.find(o => selectedObjectIds.includes(o._id || ""));

  if (canvasMode === "3D") {
    return (
      <div style={{
        width: 320,
        backgroundColor: "#0e1420",
        borderLeft: "1px solid #1f293d",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        {/* Panel Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1f293d",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span>EXTRUSION SETTINGS</span>
          <span style={{ fontSize: "1rem", cursor: "pointer", color: "#64748b" }}>⋮</span>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20, flex: 1, overflowY: "auto" }}>
          {/* Profile Section */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.05em" }}>
              Profile
            </label>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              backgroundColor: "#161e2e",
              borderRadius: 6,
              border: "1px solid #1f293d",
              fontSize: "0.85rem",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#e2e8f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#38bdf8" }}>☍</span>
                <span>Sketch_Profile_02</span>
              </div>
              <span style={{ color: "#64748b", cursor: "pointer", fontSize: "0.9rem" }}>✕</span>
            </div>
          </div>

          {/* Depth Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em" }}>
                Depth (mm)
              </label>
              <input
                type="number"
                value={extrudeDepth}
                onChange={(e) => onChangeExtrudeDepth(Number(e.target.value))}
                style={{
                  width: 54,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid #1f293d",
                  backgroundColor: "#161e2e",
                  color: "#f8fafc",
                  fontSize: "0.8rem",
                  textAlign: "center",
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              />
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={extrudeDepth}
              onChange={(e) => onChangeExtrudeDepth(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
            />
          </div>

          {/* Direction Controls */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.05em" }}>
              Direction
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button style={{
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #3b82f6",
                backgroundColor: "#1e293b",
                color: "#60a5fa",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}>
                ↑ Forward
              </button>
              <button style={{
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: "#161e2e",
                color: "#94a3b8",
                fontWeight: 500,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}>
                ↕ Symmetric
              </button>
            </div>
          </div>

          {/* Operation Controls */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.05em" }}>
              Operation
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <button style={{
                padding: "10px 4px",
                borderRadius: 6,
                border: "1px solid #3b82f6",
                backgroundColor: "#1e3a8a",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}>
                <span style={{ fontSize: "1rem" }}>⊞</span>
                New Body
              </button>
              <button style={{
                padding: "10px 4px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: "#161e2e",
                color: "#94a3b8",
                fontWeight: 500,
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}>
                <span style={{ fontSize: "1rem" }}>🔗</span>
                Join
              </button>
              <button style={{
                padding: "10px 4px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: "#161e2e",
                color: "#94a3b8",
                fontWeight: 500,
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}>
                <span style={{ fontSize: "1rem" }}>✂</span>
                Cut
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1f293d", display: "flex", gap: 12 }}>
          <button style={{
            flex: 1,
            padding: "9px",
            borderRadius: 6,
            border: "1px solid #334155",
            backgroundColor: "#161e2e",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer"
          }}>
            Cancel
          </button>
          <button style={{
            flex: 1,
            padding: "9px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
          }}>
            Apply
          </button>
        </div>
      </div>
    );
  }

  // 2D Mode Constraints & Inspector Sidebar (Matching Image 2)
  return (
    <div style={{
      width: 320,
      backgroundColor: "#0e1420",
      borderLeft: "1px solid #1f293d",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Panel Title */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid #1f293d",
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "#94a3b8"
      }}>
        CONSTRAINTS & PROPERTIES
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18, flex: 1, overflowY: "auto" }}>
        {/* Solver Status Card */}
        <div style={{
          backgroundColor: "#161e2e",
          borderRadius: 8,
          border: "1px solid #1f293d",
          padding: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#94a3b8" }}>
              SOLVER STATUS
            </span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              padding: "3px 8px",
              borderRadius: 12,
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981" }} />
              Converged
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontFamily: "'JetBrains Mono', monospace" }}>
            <div>
              <span style={{ display: "block", fontSize: "0.65rem", color: "#64748b", marginBottom: 2 }}>Algorithm</span>
              <span style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: 600 }}>Gauss-Newton</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.65rem", color: "#64748b", marginBottom: 2 }}>Residual</span>
              <span style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: 600 }}>0.0001</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.65rem", color: "#64748b", marginBottom: 2 }}>Iterations</span>
              <span style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: 600 }}>4</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.65rem", color: "#64748b", marginBottom: 2 }}>DOF</span>
              <span style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: 600 }}>0</span>
            </div>
          </div>

          <div style={{ marginTop: 12, height: 4, borderRadius: 2, backgroundColor: "#1f293d", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#10b981" }} />
          </div>
        </div>

        {/* Selected Shape Inspector */}
        {selectedObj ? (
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📈</span>
              <span>{selectedObj.type.toUpperCase()}_{selectedObj._id?.slice(0, 4)}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedObj.type === "line" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4, letterSpacing: "0.05em" }}>LENGTH (MM)</label>
                    <input
                      type="text"
                      readOnly
                      value={Math.round(Math.sqrt(
                        Math.pow((selectedObj.props.points[2] - selectedObj.props.points[0]), 2) +
                        Math.pow((selectedObj.props.points[3] - selectedObj.props.points[1]), 2)
                      )).toFixed(2)}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 4, border: "1px solid #1f293d", backgroundColor: "#161e2e", color: "#f8fafc", fontSize: "0.85rem" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>START X</label>
                      <input type="text" readOnly value={selectedObj.props.points[0]} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #1f293d", backgroundColor: "#161e2e", color: "#f8fafc", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>START Y</label>
                      <input type="text" readOnly value={selectedObj.props.points[1]} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #1f293d", backgroundColor: "#161e2e", color: "#f8fafc", fontSize: "0.8rem" }} />
                    </div>
                  </div>
                </>
              )}

              {selectedObj.type === "circle" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>RADIUS (MM)</label>
                  <input type="text" readOnly value={selectedObj.props.radius} style={{ width: "100%", padding: "6px 10px", borderRadius: 4, border: "1px solid #1f293d", backgroundColor: "#161e2e", color: "#f8fafc", fontSize: "0.85rem" }} />
                </div>
              )}

              {selectedObj.type === "rectangle" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>WIDTH</label>
                    <input type="text" readOnly value={selectedObj.props.width} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #1f293d", backgroundColor: "#161e2e", color: "#f8fafc", fontSize: "0.8rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>HEIGHT</label>
                    <input type="text" readOnly value={selectedObj.props.height} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #1f293d", backgroundColor: "#161e2e", color: "#f8fafc", fontSize: "0.8rem" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
            Select a shape to inspect properties
          </div>
        )}

        {/* Applied Constraints List */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 10 }}>
            APPLIED CONSTRAINTS ({constraints.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {constraints.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>No active constraints</div>
            ) : (
              constraints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    backgroundColor: "#161e2e",
                    borderRadius: 6,
                    border: "1px solid #1f293d",
                    fontSize: "0.8rem",
                    color: "#38bdf8",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{c.kind === "parallel" ? "∥" : c.kind === "perpendicular" ? "⊥" : "⊙"}</span>
                    <span style={{ textTransform: "capitalize" }}>{c.kind}</span>
                  </div>
                  <span
                    onClick={() => onRemoveConstraint(c.id)}
                    title="Remove constraint"
                    style={{ color: "#64748b", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    ✕
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Constraint Actions */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 10 }}>
            ADD PARAMETRIC RULE
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => onAddConstraint("coincident")}
              disabled={selectedPoints.length < 2}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: selectedPoints.length >= 2 ? "#1e3a8a" : "#161e2e",
                color: selectedPoints.length >= 2 ? "#60a5fa" : "#64748b",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: selectedPoints.length >= 2 ? "pointer" : "not-allowed"
              }}
            >
              ⊙ Coincident
            </button>

            <button
              onClick={() => onAddConstraint("parallel")}
              disabled={selectedObjectIds.length < 2}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: selectedObjectIds.length >= 2 ? "#1e3a8a" : "#161e2e",
                color: selectedObjectIds.length >= 2 ? "#60a5fa" : "#64748b",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: selectedObjectIds.length >= 2 ? "pointer" : "not-allowed"
              }}
            >
              ∥ Parallel
            </button>

            <button
              onClick={() => onAddConstraint("perpendicular")}
              disabled={selectedObjectIds.length < 2}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: selectedObjectIds.length >= 2 ? "#1e3a8a" : "#161e2e",
                color: selectedObjectIds.length >= 2 ? "#60a5fa" : "#64748b",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: selectedObjectIds.length >= 2 ? "pointer" : "not-allowed"
              }}
            >
              ⊥ Perpendicular
            </button>

            <button
              onClick={() => onAddConstraint("fixedDistance")}
              disabled={selectedPoints.length < 2}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #1f293d",
                backgroundColor: selectedPoints.length >= 2 ? "#1e3a8a" : "#161e2e",
                color: selectedPoints.length >= 2 ? "#60a5fa" : "#64748b",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: selectedPoints.length >= 2 ? "pointer" : "not-allowed"
              }}
            >
              📏 Distance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
