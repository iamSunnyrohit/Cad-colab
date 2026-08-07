import { useState, useCallback, useMemo } from "react";
import { Op, Constraint, solveConstraints } from "@cad-collab/shared";
import { transform } from "@cad-collab/shared";

export interface CanvasObject {
  _id?: string;
  type: "line" | "circle" | "rectangle";
  props: Record<string, number | number[]>;
}

export interface DocumentState {
  objects: CanvasObject[];
  constraints: Constraint[];
}

export function applyOp(state: DocumentState, op: Op): DocumentState {
  let nextObjects = [...state.objects];
  let nextConstraints = [...state.constraints];

  if (op.type === "create") {
    const exists = nextObjects.some(o => o._id === op.object.id);
    if (!exists) {
      nextObjects.push({
        _id: op.object.id,
        type: op.object.type,
        props: { ...op.object.props }
      });
    }
  } else if (op.type === "delete") {
    nextObjects = nextObjects.filter(obj => obj._id !== op.objectId);
    // Cascade delete constraints referencing this object
    nextConstraints = nextConstraints.filter(c =>
      !c.refs.some(ref => ref.split(":")[0] === op.objectId)
    );
  } else if (op.type === "addConstraint") {
    const exists = nextConstraints.some(c => c.id === op.constraint.id);
    if (!exists) {
      nextConstraints.push(op.constraint);
    }
  } else if (op.type === "removeConstraint") {
    nextConstraints = nextConstraints.filter(c => c.id !== op.constraintId);
  } else if (op.type === "move") {
    nextObjects = nextObjects.map(obj => {
      if (obj._id !== op.objectId) return obj;
      const newProps = { ...obj.props };
      if (obj.type === "circle" || obj.type === "rectangle") {
        newProps.x = (Number(newProps.x) || 0) + op.delta.dx;
        newProps.y = (Number(newProps.y) || 0) + op.delta.dy;
      } else if (obj.type === "line") {
        const points = [...(newProps.points as number[])];
        if (op.pointIndex !== undefined) {
          points[op.pointIndex * 2] += op.delta.dx;
          points[op.pointIndex * 2 + 1] += op.delta.dy;
        } else {
          for (let i = 0; i < points.length; i += 2) {
            points[i] += op.delta.dx;
            points[i + 1] += op.delta.dy;
          }
        }
        newProps.points = points;
      }
      return { ...obj, props: newProps };
    });
  }

  // Determine fixed points based on the applied operation
  const fixedPoints: Record<string, { x: number; y: number }> = {};
  if (op.type === "move") {
    const movedObj = nextObjects.find(o => o._id === op.objectId);
    if (movedObj) {
      const oId = movedObj._id!;
      if (movedObj.type === "circle") {
        fixedPoints[`${oId}:center`] = { x: movedObj.props.x as number, y: movedObj.props.y as number };
      } else if (movedObj.type === "rectangle") {
        fixedPoints[`${oId}:topLeft`] = { x: movedObj.props.x as number, y: movedObj.props.y as number };
      } else if (movedObj.type === "line") {
        const pts = movedObj.props.points as number[];
        if (op.pointIndex === 0) {
          fixedPoints[`${oId}:0`] = { x: pts[0], y: pts[1] };
        } else if (op.pointIndex === 1) {
          fixedPoints[`${oId}:1`] = { x: pts[2], y: pts[3] };
        } else {
          fixedPoints[`${oId}:0`] = { x: pts[0], y: pts[1] };
          fixedPoints[`${oId}:1`] = { x: pts[2], y: pts[3] };
        }
      }
    }
  }

  // Map client structure to solver's expected GeometryObject schema
  const solverInputs = nextObjects.map(o => ({
    id: o._id!,
    docId: "",
    type: o.type,
    version: 0,
    props: o.props as any
  }));

  const solved = solveConstraints(solverInputs, nextConstraints, fixedPoints);

  // Copy solved coordinates back to nextObjects
  const solvedMap = new Map(solved.map(s => [s.id, s.props]));
  nextObjects = nextObjects.map(obj => {
    const props = solvedMap.get(obj._id!);
    if (props) {
      return { ...obj, props };
    }
    return obj;
  });

  return { objects: nextObjects, constraints: nextConstraints };
}

interface StoreState {
  syncedObjects: CanvasObject[];
  syncedConstraints: Constraint[];
  pendingOps: Op[];
  lastSyncedSeq: number;
}

export function useOpQueue(localClientId: string) {
  const [state, setState] = useState<StoreState>({
    syncedObjects: [],
    syncedConstraints: [],
    pendingOps: [],
    lastSyncedSeq: 0
  });

  const initObjects = useCallback((objs: CanvasObject[], cons: Constraint[], version: number) => {
    setState({
      syncedObjects: objs,
      syncedConstraints: cons,
      pendingOps: [],
      lastSyncedSeq: version
    });
  }, []);

  const applyLocalOp = useCallback((op: Op) => {
    setState((prev) => ({
      ...prev,
      pendingOps: [...prev.pendingOps, op]
    }));
  }, []);

  const applyServerOp = useCallback((serverOp: Op) => {
    setState((prev) => {
      let nextSynced = { objects: prev.syncedObjects, constraints: prev.syncedConstraints };
      let nextPending = prev.pendingOps;

      if (serverOp.clientId === localClientId) {
        // Acknowledge our own pending operation
        const index = nextPending.findIndex(o => o.opId === serverOp.opId);
        if (index !== -1) {
          nextPending = [...nextPending];
          nextPending.splice(index, 1);
        }
        nextSynced = applyOp(nextSynced, serverOp);
      } else {
        // Foreign operation received: transform it past all pending operations
        let opToApply = { ...serverOp };
        const nextPendingTransformed: Op[] = [];

        for (const pendingOp of nextPending) {
          const [first, second] = transform(opToApply, pendingOp);
          if (first.opId === pendingOp.opId) {
            opToApply = second;
            nextPendingTransformed.push(first);
          } else {
            opToApply = first;
            nextPendingTransformed.push(second);
          }
        }

        nextSynced = applyOp(nextSynced, opToApply);
        nextPending = nextPendingTransformed;
      }

      return {
        syncedObjects: nextSynced.objects,
        syncedConstraints: nextSynced.constraints,
        pendingOps: nextPending,
        lastSyncedSeq: Math.max(prev.lastSyncedSeq, serverOp.seq || 0)
      };
    });
  }, [localClientId]);

  const rollbackOp = useCallback((opId: string) => {
    setState((prev) => ({
      ...prev,
      pendingOps: prev.pendingOps.filter(o => o.opId !== opId)
    }));
  }, []);

  // Compute the visible state of elements
  const visibleState = useMemo(() => {
    let current = { objects: state.syncedObjects, constraints: state.syncedConstraints };
    for (const op of state.pendingOps) {
      current = applyOp(current, op);
    }
    return current;
  }, [state.syncedObjects, state.syncedConstraints, state.pendingOps]);

  return {
    objects: visibleState.objects,
    constraints: visibleState.constraints,
    lastSyncedSeq: state.lastSyncedSeq,
    initObjects,
    applyLocalOp,
    applyServerOp,
    rollbackOp
  };
}
