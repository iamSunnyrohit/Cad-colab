import React, { useMemo } from "react";
import { Stage, Layer, Line, Circle, Rect, Group, Text } from "react-konva";
import { CanvasObject } from "../state/documentStore";
import { PeerPresence, filterVisibleObjects, snapPointToGrid, GeometryObject } from "@cad-collab/shared";

interface Props {
  objects: CanvasObject[];
  peers?: PeerPresence[];
  tool: "select" | "pan" | "line" | "circle" | "rectangle";
  zoom?: number;
  stageOffset?: { x: number; y: number };
  gridSnap?: boolean;
  selectedPoints: string[];
  selectedObjectIds: string[];
  onSelectPoint: (pointKey: string) => void;
  onSelectObject: (objectId: string) => void;
  onObjectDragStart: (index: number, pointIndex?: number) => void;
  onObjectDragMove: (index: number, dx: number, dy: number) => void;
  onObjectDragEnd: (index: number, dx: number, dy: number) => void;
  onCreate: (obj: CanvasObject) => void;
  onPointerMove?: (pos: { x: number; y: number }) => void;
  onZoomChange?: (newZoom: number) => void;
  onStageOffsetChange?: (newOffset: { x: number; y: number }) => void;
  activeColor?: string;
}

// Phase 4: Pan & Zoom, CAD Grid, Viewport Culling, Grid Snapping, and interactive drawing.
export function CanvasStage({
  objects,
  peers = [],
  tool,
  zoom = 1,
  stageOffset = { x: 0, y: 0 },
  gridSnap = false,
  selectedPoints,
  selectedObjectIds,
  onSelectPoint,
  onSelectObject,
  onObjectDragStart,
  onObjectDragMove,
  onObjectDragEnd,
  onCreate,
  onPointerMove,
  onZoomChange,
  onStageOffsetChange,
  activeColor = "#2563eb"
}: Props) {
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight - 56;

  // Compute visible viewport bounds in stage coordinates for spatial culling
  const viewportBounds = useMemo(() => {
    const minX = -stageOffset.x / zoom;
    const minY = -stageOffset.y / zoom;
    const maxX = (stageWidth - stageOffset.x) / zoom;
    const maxY = (stageHeight - stageOffset.y) / zoom;
    return { minX, minY, maxX, maxY };
  }, [stageOffset, zoom, stageWidth, stageHeight]);

  // Apply spatial indexing culling to filter non-visible shapes
  const visibleObjects = useMemo(() => {
    // Convert CanvasObject array to GeometryObject schema for culling function
    const geomObjects = objects.map(o => ({
      id: o._id || "",
      docId: "",
      type: o.type,
      version: 0,
      props: o.props as any
    })) as GeometryObject[];

    const culled = filterVisibleObjects(geomObjects, viewportBounds, 100);
    const culledIds = new Set(culled.map(c => c.id));
    return objects.filter(o => o._id && culledIds.has(o._id));
  }, [objects, viewportBounds]);

  const handleStageClick = (e: any) => {
    if (tool === "select" || tool === "pan") return;
    const stage = e.target.getStage();
    const rawPos = stage.getPointerPosition();
    if (!rawPos) return;

    // Convert raw pointer position to transformed stage coordinate
    let pos = {
      x: (rawPos.x - stageOffset.x) / zoom,
      y: (rawPos.y - stageOffset.y) / zoom
    };

    if (gridSnap) {
      pos = snapPointToGrid(pos.x, pos.y, 10);
    }

    if (tool === "line") {
      onCreate({ type: "line", props: { points: [pos.x, pos.y, pos.x + 100, pos.y], color: activeColor } as any });
    } else if (tool === "circle") {
      onCreate({ type: "circle", props: { x: pos.x, y: pos.y, radius: 40, color: activeColor } as any });
    } else if (tool === "rectangle") {
      onCreate({ type: "rectangle", props: { x: pos.x, y: pos.y, width: 100, height: 60, color: activeColor } as any });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!onPointerMove) return;
    const rawPos = e.target.getStage()?.getPointerPosition();
    if (rawPos) {
      const pos = {
        x: Math.round((rawPos.x - stageOffset.x) / zoom),
        y: Math.round((rawPos.y - stageOffset.y) / zoom)
      };
      onPointerMove(pos);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (!onZoomChange || !onStageOffsetChange) return;

    const scaleBy = 1.08;
    const stage = e.target.getStage();
    const oldZoom = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stageOffset.x) / oldZoom,
      y: (pointer.y - stageOffset.y) / oldZoom
    };

    const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
    const clampedZoom = Math.max(0.2, Math.min(5, newZoom));

    const newOffset = {
      x: pointer.x - mousePointTo.x * clampedZoom,
      y: pointer.y - mousePointTo.y * clampedZoom
    };

    onZoomChange(clampedZoom);
    onStageOffsetChange(newOffset);
  };

  const handleDragEndStage = (e: any) => {
    if (e.target.nodeType === "Stage" && onStageOffsetChange) {
      onStageOffsetChange({ x: e.target.x(), y: e.target.y() });
    }
  };

  // Generate CAD Grid lines dynamically
  const renderGridLines = () => {
    const lines = [];
    const gridSize = 40 * zoom;
    const startX = (stageOffset.x % gridSize) - gridSize;
    const startY = (stageOffset.y % gridSize) - gridSize;

    for (let x = startX; x < stageWidth + gridSize; x += gridSize) {
      lines.push(
        <Line
          key={`vgrid-${x}`}
          points={[x, 0, x, stageHeight]}
          stroke="#e2e8f0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    for (let y = startY; y < stageHeight + gridSize; y += gridSize) {
      lines.push(
        <Line
          key={`hgrid-${y}`}
          points={[0, y, stageWidth, y]}
          stroke="#e2e8f0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return lines;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <Stage
        width={stageWidth}
        height={stageHeight}
      x={stageOffset.x}
      y={stageOffset.y}
      scaleX={zoom}
      scaleY={zoom}
      draggable={tool === "pan"}
      onClick={handleStageClick}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onDragEnd={handleDragEndStage}
      style={{ cursor: tool === "pan" ? "grab" : "crosshair" }}
    >
      {/* Background CAD Grid Layer */}
      <Layer listening={false}>
        {renderGridLines()}
      </Layer>

      {/* Main Drawing Layer */}
      <Layer>
        {visibleObjects.map((obj) => {
          const i = objects.findIndex(o => o._id === obj._id);
          if (obj.type === "line") {
            const points = obj.props.points as number[];
            const isSel = selectedObjectIds.includes(obj._id || "");
            return (
              <Line
                key={obj._id || i}
                points={points}
                stroke={isSel ? "#3b82f6" : ((obj.props as any).color || "#2563eb")}
                strokeWidth={isSel ? 4 / zoom : 2 / zoom}
                hitStrokeWidth={16 / zoom}
                draggable={tool === "select"}
                onClick={(e) => {
                  if (tool === "select" && obj._id) {
                    e.cancelBubble = true;
                    onSelectObject(obj._id);
                  }
                }}
                onTap={(e) => {
                  if (tool === "select" && obj._id) {
                    e.cancelBubble = true;
                    onSelectObject(obj._id);
                  }
                }}
                onDragStart={(e) => {
                  e.target.setAttrs({ lastX: 0, lastY: 0 });
                  onObjectDragStart(i);
                }}
                onDragMove={(e) => {
                  const lastX = e.target.getAttr("lastX") || 0;
                  const lastY = e.target.getAttr("lastY") || 0;
                  const currX = e.target.x();
                  const currY = e.target.y();
                  const dx = (currX - lastX) / zoom;
                  const dy = (currY - lastY) / zoom;
                  e.target.setAttrs({ lastX: currX, lastY: currY });
                  if (dx !== 0 || dy !== 0) {
                    onObjectDragMove(i, dx, dy);
                  }
                }}
                onDragEnd={(e) => {
                  const lastX = e.target.getAttr("lastX") || 0;
                  const lastY = e.target.getAttr("lastY") || 0;
                  const currX = e.target.x();
                  const currY = e.target.y();
                  const dx = (currX - lastX) / zoom;
                  const dy = (currY - lastY) / zoom;
                  e.target.x(0);
                  e.target.y(0);
                  onObjectDragEnd(i, dx, dy);
                }}
              />
            );
          }
          if (obj.type === "circle") {
            const isSel = selectedObjectIds.includes(obj._id || "");
            return (
              <Circle
                key={obj._id || i}
                x={obj.props.x as number}
                y={obj.props.y as number}
                radius={obj.props.radius as number}
                fill="rgba(0,0,0,0.001)"
                stroke={isSel ? "#3b82f6" : ((obj.props as any).color || "#10b981")}
                strokeWidth={isSel ? 4 / zoom : 2 / zoom}
                hitStrokeWidth={12 / zoom}
                draggable={tool === "select"}
                onClick={(e) => {
                  if (tool === "select" && obj._id) {
                    e.cancelBubble = true;
                    onSelectObject(obj._id);
                  }
                }}
                onTap={(e) => {
                  if (tool === "select" && obj._id) {
                    e.cancelBubble = true;
                    onSelectObject(obj._id);
                  }
                }}
                onDragStart={(e) => {
                  e.target.setAttrs({
                    lastX: e.target.x(),
                    lastY: e.target.y()
                  });
                  onObjectDragStart(i);
                }}
                onDragMove={(e) => {
                  const lastX = e.target.getAttr("lastX") || 0;
                  const lastY = e.target.getAttr("lastY") || 0;
                  const currX = e.target.x();
                  const currY = e.target.y();
                  const dx = (currX - lastX) / zoom;
                  const dy = (currY - lastY) / zoom;
                  e.target.setAttrs({ lastX: currX, lastY: currY });
                  if (dx !== 0 || dy !== 0) {
                    onObjectDragMove(i, dx, dy);
                  }
                }}
                onDragEnd={(e) => {
                  const lastX = e.target.getAttr("lastX") || 0;
                  const lastY = e.target.getAttr("lastY") || 0;
                  const currX = e.target.x();
                  const currY = e.target.y();
                  const dx = (currX - lastX) / zoom;
                  const dy = (currY - lastY) / zoom;
                  onObjectDragEnd(i, dx, dy);
                }}
              />
            );
          }
          if (obj.type === "rectangle") {
            const isSel = selectedObjectIds.includes(obj._id || "");
            return (
              <Rect
                key={obj._id || i}
                x={obj.props.x as number}
                y={obj.props.y as number}
                width={obj.props.width as number}
                height={obj.props.height as number}
                fill="rgba(0,0,0,0.001)"
                stroke={isSel ? "#3b82f6" : ((obj.props as any).color || "#ef4444")}
                strokeWidth={isSel ? 4 / zoom : 2 / zoom}
                hitStrokeWidth={12 / zoom}
                draggable={tool === "select"}
                onClick={(e) => {
                  if (tool === "select" && obj._id) {
                    e.cancelBubble = true;
                    onSelectObject(obj._id);
                  }
                }}
                onTap={(e) => {
                  if (tool === "select" && obj._id) {
                    e.cancelBubble = true;
                    onSelectObject(obj._id);
                  }
                }}
                onDragStart={(e) => {
                  e.target.setAttrs({
                    lastX: e.target.x(),
                    lastY: e.target.y()
                  });
                  onObjectDragStart(i);
                }}
                onDragMove={(e) => {
                  const lastX = e.target.getAttr("lastX") || 0;
                  const lastY = e.target.getAttr("lastY") || 0;
                  const currX = e.target.x();
                  const currY = e.target.y();
                  const dx = (currX - lastX) / zoom;
                  const dy = (currY - lastY) / zoom;
                  e.target.setAttrs({ lastX: currX, lastY: currY });
                  if (dx !== 0 || dy !== 0) {
                    onObjectDragMove(i, dx, dy);
                  }
                }}
                onDragEnd={(e) => {
                  const lastX = e.target.getAttr("lastX") || 0;
                  const lastY = e.target.getAttr("lastY") || 0;
                  const currX = e.target.x();
                  const currY = e.target.y();
                  const dx = (currX - lastX) / zoom;
                  const dy = (currY - lastY) / zoom;
                  onObjectDragEnd(i, dx, dy);
                }}
              />
            );
          }
          return null;
        })}

        {/* Render Anchor Handles in Select Mode */}
        {tool === "select" && visibleObjects.map((obj) => {
          const i = objects.findIndex(o => o._id === obj._id);
          if (obj.type === "circle" && obj._id) {
            const cx = obj.props.x as number;
            const cy = obj.props.y as number;
            const isSel = selectedPoints.includes(`${obj._id}:center`);
            return (
              <Circle
                key={`handle-${obj._id}-center`}
                x={cx}
                y={cy}
                radius={7 / zoom}
                fill={isSel ? "#3b82f6" : "#ffffff"}
                stroke="#1f2937"
                strokeWidth={1.5 / zoom}
                hitStrokeWidth={12 / zoom}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectPoint(`${obj._id}:center`);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  onSelectPoint(`${obj._id}:center`);
                }}
              />
            );
          }
          if (obj.type === "rectangle" && obj._id) {
            const rx = obj.props.x as number;
            const ry = obj.props.y as number;
            const isSel = selectedPoints.includes(`${obj._id}:topLeft`);
            return (
              <Circle
                key={`handle-${obj._id}-topLeft`}
                x={rx}
                y={ry}
                radius={7 / zoom}
                fill={isSel ? "#3b82f6" : "#ffffff"}
                stroke="#1f2937"
                strokeWidth={1.5 / zoom}
                hitStrokeWidth={12 / zoom}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectPoint(`${obj._id}:topLeft`);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  onSelectPoint(`${obj._id}:topLeft`);
                }}
              />
            );
          }
          if (obj.type === "line" && obj._id) {
            const pts = obj.props.points as number[];
            const isSel0 = selectedPoints.includes(`${obj._id}:0`);
            const isSel1 = selectedPoints.includes(`${obj._id}:1`);
            return (
              <React.Fragment key={`handles-${obj._id}`}>
                {/* Endpoint 0 */}
                <Circle
                  x={pts[0]}
                  y={pts[1]}
                  radius={7 / zoom}
                  fill={isSel0 ? "#3b82f6" : "#ffffff"}
                  stroke="#1f2937"
                  strokeWidth={1.5 / zoom}
                  hitStrokeWidth={12 / zoom}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelectPoint(`${obj._id}:0`);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onSelectPoint(`${obj._id}:0`);
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.target.setAttrs({ lastX: e.target.x(), lastY: e.target.y() });
                    onObjectDragStart(i, 0);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const lastX = e.target.getAttr("lastX") || 0;
                    const lastY = e.target.getAttr("lastY") || 0;
                    const currX = e.target.x();
                    const currY = e.target.y();
                    const dx = (currX - lastX) / zoom;
                    const dy = (currY - lastY) / zoom;
                    e.target.setAttrs({ lastX: currX, lastY: currY });
                    if (dx !== 0 || dy !== 0) {
                      onObjectDragMove(i, dx, dy);
                    }
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    const lastX = e.target.getAttr("lastX") || 0;
                    const lastY = e.target.getAttr("lastY") || 0;
                    const currX = e.target.x();
                    const currY = e.target.y();
                    const dx = (currX - lastX) / zoom;
                    const dy = (currY - lastY) / zoom;
                    onObjectDragEnd(i, dx, dy);
                  }}
                />
                {/* Endpoint 1 */}
                <Circle
                  x={pts[2]}
                  y={pts[3]}
                  radius={7 / zoom}
                  fill={isSel1 ? "#3b82f6" : "#ffffff"}
                  stroke="#1f2937"
                  strokeWidth={1.5 / zoom}
                  hitStrokeWidth={12 / zoom}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelectPoint(`${obj._id}:1`);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onSelectPoint(`${obj._id}:1`);
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.target.setAttrs({ lastX: e.target.x(), lastY: e.target.y() });
                    onObjectDragStart(i, 1);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    const lastX = e.target.getAttr("lastX") || 0;
                    const lastY = e.target.getAttr("lastY") || 0;
                    const currX = e.target.x();
                    const currY = e.target.y();
                    const dx = (currX - lastX) / zoom;
                    const dy = (currY - lastY) / zoom;
                    e.target.setAttrs({ lastX: currX, lastY: currY });
                    if (dx !== 0 || dy !== 0) {
                      onObjectDragMove(i, dx, dy);
                    }
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    const lastX = e.target.getAttr("lastX") || 0;
                    const lastY = e.target.getAttr("lastY") || 0;
                    const currX = e.target.x();
                    const currY = e.target.y();
                    const dx = (currX - lastX) / zoom;
                    const dy = (currY - lastY) / zoom;
                    onObjectDragEnd(i, dx, dy);
                  }}
                />
              </React.Fragment>
            );
          }
          return null;
        })}

        {/* Phase 3: Render Live Peer Presence Cursors */}
        {peers.map((peer) => {
          if (!peer.cursor) return null;
          const { x, y } = peer.cursor;
          const userColor = peer.color || "#3b82f6";
          const label = peer.userName || `User ${peer.clientId.slice(0, 4)}`;

          return (
            <Group key={`cursor-${peer.socketId}`} x={x} y={y} listening={false}>
              {/* Pointer Arrow */}
              <Line
                points={[0, 0, 0, 16 / zoom, 5 / zoom, 12 / zoom, 10 / zoom, 20 / zoom, 13 / zoom, 18 / zoom, 8 / zoom, 10 / zoom, 15 / zoom, 10 / zoom]}
                fill={userColor}
                stroke="#ffffff"
                strokeWidth={1 / zoom}
                closed
              />
              {/* User Label Badge */}
              <Rect
                x={14 / zoom}
                y={14 / zoom}
                width={(label.length * 7 + 12) / zoom}
                height={20 / zoom}
                fill={userColor}
                cornerRadius={4 / zoom}
                shadowColor="rgba(0,0,0,0.15)"
                shadowBlur={4 / zoom}
              />
              <Text
                x={20 / zoom}
                y={18 / zoom}
                text={label}
                fontSize={11 / zoom}
                fontStyle="bold"
                fill="#ffffff"
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>

    {/* Floating CAD Command Prompt HUD (Benchmarking UI Pattern) */}
    <div style={{
      position: "absolute",
      bottom: 16,
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      padding: "8px 18px",
      borderRadius: 20,
      border: "1px solid #1f293d",
      color: "#f8fafc",
      fontSize: "0.8rem",
      fontFamily: "'JetBrains Mono', monospace",
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      pointerEvents: "none",
      zIndex: 20
    }}>
      <span style={{ color: "#38bdf8", fontWeight: 700 }}>COMMAND:</span>
      <span style={{ color: "#e2e8f0" }}>
        {tool === "select" ? "Select mode: Click shapes or handles to inspect properties | Drag to translate" :
         tool === "line" ? "Line Tool: Click canvas stage to draw a parametric line segment" :
         tool === "circle" ? "Circle Tool: Click canvas stage to draw a parametric circle" :
         tool === "rectangle" ? "Rectangle Tool: Click canvas stage to draw a parametric rectangle" :
         "Pan Tool: Drag canvas stage to navigate viewport"}
      </span>
    </div>
  </div>
  );
}
