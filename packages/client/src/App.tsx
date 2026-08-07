import React, { useEffect, useState, useRef } from "react";
import { Toolbar, Tool } from "./ui/Toolbar";
import { CanvasStage } from "./canvas/CanvasStage";
import { Canvas3DStage } from "./canvas/Canvas3DStage";
import { AuthModal } from "./ui/AuthModal";
import { HomePage } from "./ui/HomePage";
import { useOpQueue, CanvasObject } from "./state/opQueue";
import { usePresence } from "./state/usePresence";
import { createDocument, loadObjects, fetchMissedOps } from "./net/api";
import { fetchCurrentUser, clearSavedToken } from "./net/authApi";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { OpSender } from "./net/opSender";
import { CreateOp, AddConstraintOp, RemoveConstraintOp, Constraint, UserProfile } from "@cad-collab/shared";

// @ts-ignore
import ConstraintSolverWorker from "./workers/constraintSolver.worker?worker";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "cad">("home");
  const [canvasMode, setCanvasMode] = useState<"2D" | "3D">("2D");
  const [extrudeDepth, setExtrudeDepth] = useState(40);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [anonClientId] = useState(() => uuidv4());
  const [docId, setDocId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [stageOffset, setStageOffset] = useState({ x: 0, y: 0 });
  const [gridSnap, setGridSnap] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const clientId = currentUser ? currentUser.id : anonClientId;
  const userName = currentUser ? currentUser.username : undefined;

  const { objects, constraints, lastSyncedSeq, initObjects, applyLocalOp, applyServerOp, rollbackOp } = useOpQueue(clientId);
  const { peers, connectionStatus, updateLocalCursor } = usePresence(socket, docId, clientId, userName);
  const [opSender, setOpSender] = useState<OpSender | null>(null);

  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [previewObjects, setPreviewObjects] = useState<CanvasObject[] | null>(null);

  const activeDragRef = useRef<{ index: number; pointIndex?: number } | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Check saved authentication token on initial load
  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  const handleSignOut = () => {
    clearSavedToken();
    setCurrentUser(null);
  };

  const handleZoomIn = () => setZoom(z => Math.min(5, Number((z * 1.2).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.2, Number((z / 1.2).toFixed(2))));
  const handleResetZoom = () => { setZoom(1); setStageOffset({ x: 0, y: 0 }); };
  const handleToggleGridSnap = () => setGridSnap(g => !g);

  const lastSyncedSeqRef = useRef(lastSyncedSeq);
  useEffect(() => {
    lastSyncedSeqRef.current = lastSyncedSeq;
  }, [lastSyncedSeq]);

  // Instantiate solver Web Worker
  useEffect(() => {
    const worker = new ConstraintSolverWorker();
    workerRef.current = worker;

    worker.onmessage = (e: any) => {
      const solved = e.data.objects as any[];
      const solvedMap = new Map(solved.map(s => [s.id, s.props]));
      
      // Update preview objects
      const nextPreview = objects.map(o => ({
        ...o,
        props: solvedMap.get(o._id!) || o.props
      }));
      setPreviewObjects(nextPreview);
    };

    return () => {
      worker.terminate();
    };
  }, [objects]);

  useEffect(() => {
    let activeSocket: Socket;

    (async () => {
      let targetDocId = docId;
      if (!targetDocId) {
        const doc = await createDocument("Untitled Drawing");
        targetDocId = doc._id as string;
        setDocId(doc._id);
      }
      if (!targetDocId) return;

      const res = await loadObjects(targetDocId);
      initObjects(
        res.objects.map((o: any) => ({ _id: o._id, type: o.type, props: o.props })),
        res.constraints || [],
        res.version
      );

      // Connect socket to server
      activeSocket = io("http://localhost:4000");
      setSocket(activeSocket);

      activeSocket.emit("join-document", { docId: targetDocId, clientId });

      // Handle socket reconnection catch-up sync
      activeSocket.on("connect", async () => {
        if (targetDocId) {
          activeSocket.emit("join-document", { docId: targetDocId, clientId });
          if (lastSyncedSeqRef.current > 0) {
            try {
              const { ops } = await fetchMissedOps(targetDocId, lastSyncedSeqRef.current);
              if (Array.isArray(ops)) {
                for (const missedOp of ops) {
                  applyServerOp(missedOp);
                }
              }
            } catch (err) {
              console.error("Failed to catch up missed ops:", err);
            }
          }
        }
      });

      activeSocket.on("op-applied", (op: any) => {
        applyServerOp(op);
      });

      activeSocket.on("op-error", ({ opId, error }: { opId: string; error: string }) => {
        rollbackOp(opId);
        alert(`Constraint Error: ${error}`);
      });
    })();

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [docId, clientId, initObjects, applyServerOp, rollbackOp]);

  // Initialize OpSender helper
  useEffect(() => {
    if (!socket || !docId) return;
    const sender = new OpSender(
      socket,
      docId,
      clientId,
      () => lastSyncedSeqRef.current,
      applyLocalOp
    );
    setOpSender(sender);
  }, [socket, docId, clientId, applyLocalOp]);

  const handleCreate = (obj: CanvasObject) => {
    if (!docId || !socket) return;
    const objId = uuidv4();
    const op: CreateOp = {
      opId: uuidv4(),
      docId,
      clientId,
      timestamp: Date.now(),
      refSeq: lastSyncedSeqRef.current,
      type: "create",
      object: {
        id: objId,
        docId,
        type: obj.type,
        version: 0,
        props: obj.props as any
      }
    };

    applyLocalOp(op);
    socket.emit("submit-op", op);
  };

  const handleDragStart = (index: number, pointIndex?: number) => {
    const obj = objects[index];
    if (obj && obj._id && opSender) {
      activeDragRef.current = { index, pointIndex };
      opSender.registerDragStart(obj._id, pointIndex);
    }
  };

  const handleDragMove = (index: number, dx: number, dy: number) => {
    if (opSender) {
      opSender.registerDragMove(dx, dy);
    }

    const activeDrag = activeDragRef.current;
    if (!activeDrag || !workerRef.current) return;

    // Shift dragged element coordinates locally for worker solver input
    const solverInputs = objects.map((o, i) => {
      if (i !== index) {
        return {
          id: o._id!,
          docId: "",
          type: o.type,
          version: 0,
          props: o.props as any
        };
      }
      const nextProps = { ...o.props };
      if (o.type === "circle" || o.type === "rectangle") {
        nextProps.x = (Number(nextProps.x) || 0) + dx;
        nextProps.y = (Number(nextProps.y) || 0) + dy;
      } else if (o.type === "line") {
        const pts = [...(nextProps.points as number[])];
        if (activeDrag.pointIndex === 0) {
          pts[0] += dx;
          pts[1] += dy;
        } else if (activeDrag.pointIndex === 1) {
          pts[2] += dx;
          pts[3] += dy;
        } else {
          pts[0] += dx;
          pts[1] += dy;
          pts[2] += dx;
          pts[3] += dy;
        }
        nextProps.points = pts;
      }
      return {
        id: o._id!,
        docId: "",
        type: o.type,
        version: 0,
        props: nextProps as any
      };
    });

    // Populate current fixed points based on active drag handles
    const fixedPoints: Record<string, { x: number; y: number }> = {};
    const draggedObj = solverInputs[index];
    if (draggedObj.type === "circle") {
      fixedPoints[`${draggedObj.id}:center`] = { x: draggedObj.props.x, y: draggedObj.props.y };
    } else if (draggedObj.type === "rectangle") {
      fixedPoints[`${draggedObj.id}:topLeft`] = { x: draggedObj.props.x, y: draggedObj.props.y };
    } else if (draggedObj.type === "line") {
      if (activeDrag.pointIndex === 0) {
        fixedPoints[`${draggedObj.id}:0`] = { x: draggedObj.props.points[0], y: draggedObj.props.points[1] };
      } else if (activeDrag.pointIndex === 1) {
        fixedPoints[`${draggedObj.id}:1`] = { x: draggedObj.props.points[2], y: draggedObj.props.points[3] };
      } else {
        fixedPoints[`${draggedObj.id}:0`] = { x: draggedObj.props.points[0], y: draggedObj.props.points[1] };
        fixedPoints[`${draggedObj.id}:1`] = { x: draggedObj.props.points[2], y: draggedObj.props.points[3] };
      }
    }

    // Trigger worker calculation
    workerRef.current.postMessage({
      objects: solverInputs,
      constraints,
      fixedPoints
    });
  };

  const handleDragEnd = (index: number, dx: number, dy: number) => {
    if (opSender) {
      opSender.registerDragEnd(dx, dy);
    }
    activeDragRef.current = null;
    setPreviewObjects(null);
  };

  const handleSave = () => {
    alert(`Document ${docId} is automatically synchronized in real-time.`);
  };

  const handleSelectPoint = (key: string) => {
    setSelectedObjectIds([]); // Clear line selections
    setSelectedPoints(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 2) {
        return [prev[1], key];
      }
      return [...prev, key];
    });
  };

  const handleSelectObject = (id: string) => {
    setSelectedPoints([]); // Clear point selections
    setSelectedObjectIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  // Add Constraints mutations
  const addCoincident = () => {
    if (selectedPoints.length !== 2 || !docId || !socket) return;
    const op: AddConstraintOp = {
      opId: uuidv4(),
      docId,
      clientId,
      timestamp: Date.now(),
      refSeq: lastSyncedSeqRef.current,
      type: "addConstraint",
      constraint: {
        id: uuidv4(),
        kind: "coincident",
        refs: [selectedPoints[0], selectedPoints[1]]
      }
    };
    applyLocalOp(op);
    socket.emit("submit-op", op);
    setSelectedPoints([]);
  };

  const addDistance = () => {
    if (selectedPoints.length !== 2 || !docId || !socket) return;
    const distStr = prompt("Enter target distance in pixels:", "100");
    if (!distStr) return;
    const distance = parseFloat(distStr);
    if (isNaN(distance) || distance <= 0) {
      alert("Invalid distance!");
      return;
    }

    const op: AddConstraintOp = {
      opId: uuidv4(),
      docId,
      clientId,
      timestamp: Date.now(),
      refSeq: lastSyncedSeqRef.current,
      type: "addConstraint",
      constraint: {
        id: uuidv4(),
        kind: "fixedDistance",
        refs: [selectedPoints[0], selectedPoints[1]],
        params: { distance }
      }
    };
    applyLocalOp(op);
    socket.emit("submit-op", op);
    setSelectedPoints([]);
  };

  const addParallel = () => {
    if (selectedObjectIds.length !== 2 || !docId || !socket) return;
    const op: AddConstraintOp = {
      opId: uuidv4(),
      docId,
      clientId,
      timestamp: Date.now(),
      refSeq: lastSyncedSeqRef.current,
      type: "addConstraint",
      constraint: {
        id: uuidv4(),
        kind: "parallel",
        refs: [selectedObjectIds[0], selectedObjectIds[1]]
      }
    };
    applyLocalOp(op);
    socket.emit("submit-op", op);
    setSelectedObjectIds([]);
  };

  const addPerpendicular = () => {
    if (selectedObjectIds.length !== 2 || !docId || !socket) return;
    const op: AddConstraintOp = {
      opId: uuidv4(),
      docId,
      clientId,
      timestamp: Date.now(),
      refSeq: lastSyncedSeqRef.current,
      type: "addConstraint",
      constraint: {
        id: uuidv4(),
        kind: "perpendicular",
        refs: [selectedObjectIds[0], selectedObjectIds[1]]
      }
    };
    applyLocalOp(op);
    socket.emit("submit-op", op);
    setSelectedObjectIds([]);
  };

  const deleteConstraint = (constraintId: string) => {
    if (!docId || !socket) return;
    const op: RemoveConstraintOp = {
      opId: uuidv4(),
      docId,
      clientId,
      timestamp: Date.now(),
      refSeq: lastSyncedSeqRef.current,
      type: "removeConstraint",
      constraintId
    };
    applyLocalOp(op);
    socket.emit("submit-op", op);
  };

  // Helper function to resolve human readable object labels
  const getObjectLabel = (id: string) => {
    const obj = objects.find(o => o._id === id);
    if (!obj) return id.slice(0, 5);
    return `${obj.type.toUpperCase()} (${obj._id?.slice(0, 4)})`;
  };

  const getRefLabel = (ref: string) => {
    const parts = ref.split(":");
    const label = getObjectLabel(parts[0]);
    if (parts[1] === "0" || parts[1] === "1") {
      return `${label} endpoint ${parts[1]}`;
    }
    return `${label} ${parts[1]}`;
  };

  if (currentView === "home") {
    return (
      <>
        {showAuthModal && (
          <AuthModal onSuccess={(user) => { setCurrentUser(user); setShowAuthModal(false); }} />
        )}
        <HomePage
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
          onOpenDocument={(id) => {
            setDocId(id);
            setCurrentView("cad");
          }}
        />
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f9fafb" }}>
      {/* Auth Modal overlay */}
      {showAuthModal && (
        <AuthModal onSuccess={(user) => { setCurrentUser(user); setShowAuthModal(false); }} />
      )}

      {/* Top toolbar */}
      <Toolbar
        tool={tool}
        zoom={zoom}
        gridSnap={gridSnap}
        objectCount={objects.length}
        currentUser={currentUser}
        canvasMode={canvasMode}
        extrudeDepth={extrudeDepth}
        onChange={(t) => { setTool(t); setSelectedPoints([]); setSelectedObjectIds([]); }}
        onSave={handleSave}
        onNavigateHome={() => setCurrentView("home")}
        onSignOut={handleSignOut}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleGridSnap={handleToggleGridSnap}
        onToggleCanvasMode={() => setCanvasMode(m => m === "2D" ? "3D" : "2D")}
        onChangeExtrudeDepth={setExtrudeDepth}
        connectionStatus={connectionStatus}
        peers={peers}
      />
      
      {/* Main workspace (canvas + sidebar) */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        
        {/* Drawing canvas (2D Konva Stage vs 3D WebGL Three.js Viewport) */}
        <div style={{ flex: 1, position: "relative" }}>
          {canvasMode === "3D" ? (
            <Canvas3DStage
              objects={previewObjects || objects}
              peers={peers}
              extrudeDepth={extrudeDepth}
            />
          ) : (
            <CanvasStage
              objects={previewObjects || objects}
              peers={peers}
              tool={tool}
              zoom={zoom}
              stageOffset={stageOffset}
              gridSnap={gridSnap}
              selectedPoints={selectedPoints}
              selectedObjectIds={selectedObjectIds}
              onSelectPoint={handleSelectPoint}
              onSelectObject={handleSelectObject}
              onObjectDragStart={handleDragStart}
              onObjectDragMove={handleDragMove}
              onObjectDragEnd={handleDragEnd}
              onCreate={handleCreate}
              onPointerMove={updateLocalCursor}
              onZoomChange={setZoom}
              onStageOffsetChange={setStageOffset}
            />
          )}
        </div>

        {/* Sidebar panel */}
        <div style={{
          width: 320,
          borderLeft: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.03)",
          overflowY: "auto",
          zIndex: 10
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px 0", color: "#111827" }}>Constraints Manager</h2>

          {/* Context selections display */}
          <div style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#f3f4f6",
            border: "1px dashed #d1d5db",
            marginBottom: 20
          }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px 0", color: "#374151" }}>Current Selection</h3>
            
            {selectedPoints.length === 0 && selectedObjectIds.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>
                Select points or lines in the drawing stage (using Select tool) to add constraints.
              </p>
            )}

            {selectedPoints.length > 0 && (
              <div>
                <p style={{ fontSize: "0.8rem", color: "#111827", margin: "0 0 8px 0" }}>
                  Selected Points ({selectedPoints.length}/2):
                </p>
                <ul style={{ paddingLeft: 16, margin: "0 0 12px 0", fontSize: "0.75rem", color: "#4b5563" }}>
                  {selectedPoints.map(p => <li key={p}>{getRefLabel(p)}</li>)}
                </ul>

                {selectedPoints.length === 2 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addCoincident} style={{ flex: 1, padding: "6px 8px", fontSize: "0.75rem", borderRadius: 4, border: "none", backgroundColor: "#2563eb", color: "#ffffff", cursor: "pointer", fontWeight: 600 }}>
                      Coincident
                    </button>
                    <button onClick={addDistance} style={{ flex: 1, padding: "6px 8px", fontSize: "0.75rem", borderRadius: 4, border: "1px solid #d1d5db", backgroundColor: "#ffffff", color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                      Distance
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedObjectIds.length > 0 && (
              <div>
                <p style={{ fontSize: "0.8rem", color: "#111827", margin: "0 0 8px 0" }}>
                  Selected Lines ({selectedObjectIds.length}/2):
                </p>
                <ul style={{ paddingLeft: 16, margin: "0 0 12px 0", fontSize: "0.75rem", color: "#4b5563" }}>
                  {selectedObjectIds.map(id => <li key={id}>{getObjectLabel(id)}</li>)}
                </ul>

                {selectedObjectIds.length === 2 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addParallel} style={{ flex: 1, padding: "6px 8px", fontSize: "0.75rem", borderRadius: 4, border: "none", backgroundColor: "#2563eb", color: "#ffffff", cursor: "pointer", fontWeight: 600 }}>
                      Parallel
                    </button>
                    <button onClick={addPerpendicular} style={{ flex: 1, padding: "6px 8px", fontSize: "0.75rem", borderRadius: 4, border: "1px solid #d1d5db", backgroundColor: "#ffffff", color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                      Perpendicular
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Constraints List */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0 0 12px 0", color: "#374151" }}>Active Constraints ({constraints.length})</h3>
            
            {constraints.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "center", margin: "24px 0" }}>No constraints set.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {constraints.map(c => (
                  <div key={c.id} style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb"
                  }}>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827", textTransform: "capitalize" }}>
                        {c.kind} {c.params?.distance ? `(${c.params.distance}px)` : ""}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.refs.map(r => getRefLabel(r)).join(" ↔ ")}
                      </div>
                    </div>
                    <button onClick={() => deleteConstraint(c.id)} style={{
                      padding: "4px 8px",
                      fontSize: "0.7rem",
                      borderRadius: 4,
                      border: "none",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontWeight: 600,
                      marginLeft: 8
                    }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
