import React from "react";

type Tool = "select" | "line" | "circle" | "rectangle";

interface Props {
  tool: Tool;
  onChange: (tool: Tool) => void;
  onSave: () => void;
}

const tools: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "line", label: "Line" },
  { id: "circle", label: "Circle" },
  { id: "rectangle", label: "Rectangle" }
];

export function Toolbar({ tool, onChange, onSave }: Props) {
  return (
    <div style={{ height: 56, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderBottom: "1px solid #e5e7eb" }}>
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
            cursor: "pointer"
          }}
        >
          {t.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={onSave} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
        Save snapshot
      </button>
    </div>
  );
}
