import React from "react";
import { Stage, Layer, Line, Circle, Rect, Group, Text } from "react-konva";
import { CanvasObject } from "../state/documentStore";
import { PeerPresence } from "@cad-collab/shared";

interface Props {
  objects: CanvasObject[];
  peers?: PeerPresence[];
  tool: "select" | "line" | "circle" | "rectangle";
  selectedPoints: string[];
  selectedObjectIds: string[];
  onSelectPoint: (pointKey: string) => void;
  onSelectObject: (objectId: string) => void;
  onObjectDragStart: (index: number, pointIndex?: number) => void;
  onObjectDragMove: (index: number, dx: number, dy: number) => void;
  onObjectDragEnd: (index: number, dx: number, dy: number) => void;
  onCreate: (obj: CanvasObject) => void;
  onPointerMove?: (pos: { x: number; y: number }) => void;
}

// Phase 0/1/2/3: click-to-place shapes, drag to move, selectable points for constraints, and live peer presence cursors.
export function CanvasStage({
  objects,
  peers = [],
  tool,
  selectedPoints,
  selectedObjectIds,
  onSelectPoint,
  onSelectObject,
  onObjectDragStart,
  onObjectDragMove,
  onObjectDragEnd,
  onCreate,
  onPointerMove
}: Props) {
  const handleStageClick = (e: any) => {
    if (tool === "select") return;
    const pos = e.target.getStage().getPointerPosition();

    if (tool === "line") {
      onCreate({ type: "line", props: { points: [pos.x, pos.y, pos.x + 100, pos.y] } });
    } else if (tool === "circle") {
      onCreate({ type: "circle", props: { x: pos.x, y: pos.y, radius: 40 } });
    } else if (tool === "rectangle") {
      onCreate({ type: "rectangle", props: { x: pos.x, y: pos.y, width: 100, height: 60 } });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!onPointerMove) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      onPointerMove({ x: Math.round(pos.x), y: Math.round(pos.y) });
    }
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight - 56}
      onClick={handleStageClick}
      onMouseMove={handleMouseMove}
    >
      <Layer>
        {objects.map((obj, i) => {
          if (obj.type === "line") {
            const points = obj.props.points as number[];
            const isSel = selectedObjectIds.includes(obj._id || "");
            return (
              <Line
                key={i}
                points={points}
                stroke={isSel ? "#3b82f6" : "#2563eb"}
                strokeWidth={isSel ? 4 : 2}
                draggable
                onClick={(e) => {
                  if (tool === "select") {
                    e.cancelBubble = true;
                    onSelectObject(obj._id!);
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
                  const dx = currX - lastX;
                  const dy = currY - lastY;
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
                  const dx = currX - lastX;
                  const dy = currY - lastY;
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
                key={i}
                x={obj.props.x as number}
                y={obj.props.y as number}
                radius={obj.props.radius as number}
                stroke={isSel ? "#3b82f6" : "#16a34a"}
                strokeWidth={isSel ? 4 : 2}
                draggable
                onClick={(e) => {
                  if (tool === "select") {
                    e.cancelBubble = true;
                    onSelectObject(obj._id!);
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
                  const dx = currX - lastX;
                  const dy = currY - lastY;
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
                  const dx = currX - lastX;
                  const dy = currY - lastY;
                  onObjectDragEnd(i, dx, dy);
                }}
              />
            );
          }
          if (obj.type === "rectangle") {
            const isSel = selectedObjectIds.includes(obj._id || "");
            return (
              <Rect
                key={i}
                x={obj.props.x as number}
                y={obj.props.y as number}
                width={obj.props.width as number}
                height={obj.props.height as number}
                stroke={isSel ? "#3b82f6" : "#dc2626"}
                strokeWidth={isSel ? 4 : 2}
                draggable
                onClick={(e) => {
                  if (tool === "select") {
                    e.cancelBubble = true;
                    onSelectObject(obj._id!);
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
                  const dx = currX - lastX;
                  const dy = currY - lastY;
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
                  const dx = currX - lastX;
                  const dy = currY - lastY;
                  onObjectDragEnd(i, dx, dy);
                }}
              />
            );
          }
          return null;
        })}

        {/* Render Anchor Handles in Select Mode */}
        {tool === "select" && objects.map((obj, i) => {
          if (obj.type === "circle" && obj._id) {
            const cx = obj.props.x as number;
            const cy = obj.props.y as number;
            const isSel = selectedPoints.includes(`${obj._id}:center`);
            return (
              <Circle
                key={`handle-${obj._id}-center`}
                x={cx}
                y={cy}
                radius={6}
                fill={isSel ? "#3b82f6" : "#e5e7eb"}
                stroke="#1f2937"
                strokeWidth={1.5}
                onClick={(e) => {
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
                radius={6}
                fill={isSel ? "#3b82f6" : "#e5e7eb"}
                stroke="#1f2937"
                strokeWidth={1.5}
                onClick={(e) => {
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
                  radius={6}
                  fill={isSel0 ? "#3b82f6" : "#e5e7eb"}
                  stroke="#1f2937"
                  strokeWidth={1.5}
                  onClick={(e) => {
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
                    const dx = currX - lastX;
                    const dy = currY - lastY;
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
                    const dx = currX - lastX;
                    const dy = currY - lastY;
                    onObjectDragEnd(i, dx, dy);
                  }}
                />
                {/* Endpoint 1 */}
                <Circle
                  x={pts[2]}
                  y={pts[3]}
                  radius={6}
                  fill={isSel1 ? "#3b82f6" : "#e5e7eb"}
                  stroke="#1f2937"
                  strokeWidth={1.5}
                  onClick={(e) => {
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
                    const dx = currX - lastX;
                    const dy = currY - lastY;
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
                    const dx = currX - lastX;
                    const dy = currY - lastY;
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
                points={[0, 0, 0, 16, 5, 12, 10, 20, 13, 18, 8, 10, 15, 10]}
                fill={userColor}
                stroke="#ffffff"
                strokeWidth={1}
                closed
              />
              {/* User Label Badge */}
              <Rect
                x={14}
                y={14}
                width={label.length * 7 + 12}
                height={20}
                fill={userColor}
                cornerRadius={4}
                shadowColor="rgba(0,0,0,0.15)"
                shadowBlur={4}
                shadowOffset={{ x: 1, y: 1 }}
              />
              <Text
                x={20}
                y={18}
                text={label}
                fontSize={11}
                fontStyle="bold"
                fill="#ffffff"
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
