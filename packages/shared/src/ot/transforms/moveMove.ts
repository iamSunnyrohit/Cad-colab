import { MoveOp } from "../../types/operations";

/**
 * Transformation function for two concurrent MoveOps.
 *
 * Phase 1 rule:
 * - If the ops target different objects/points → they commute, apply both unchanged.
 * - If they target the same object+point → sequence deterministically by timestamp
 *   (earlier timestamp "wins" positionally; later op's delta is re-applied on top
 *   of the already-moved position rather than the original, since ops are deltas
 *   this just means: apply in timestamp order, no coordinate rewrite needed).
 *
 * Returns the two ops in the order they should be applied.
 */
export function transformMoveMove(opA: MoveOp, opB: MoveOp): [MoveOp, MoveOp] {
  const sameTarget = opA.objectId === opB.objectId && opA.pointIndex === opB.pointIndex;

  if (!sameTarget) {
    // independent ops commute — order doesn't matter
    return [opA, opB];
  }

  // same point: apply earlier timestamp first, break ties by clientId for determinism
  if (opA.timestamp === opB.timestamp) {
    return opA.clientId < opB.clientId ? [opA, opB] : [opB, opA];
  }
  return opA.timestamp < opB.timestamp ? [opA, opB] : [opB, opA];
}
