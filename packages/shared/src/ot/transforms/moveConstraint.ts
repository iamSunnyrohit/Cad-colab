import { MoveOp, AddConstraintOp } from "../../types/operations";

/**
 * Transforms a MoveOp and an AddConstraintOp that happened concurrently.
 * Since the solver weight system ensures deterministic convergence
 * (e.g. lines snap to circles, and moves on circle centers propagate to lines),
 * the operations commute directly without coordinate rewriting.
 */
export function transformMoveConstraint(
  moveOp: MoveOp,
  addConstraintOp: AddConstraintOp
): [MoveOp, AddConstraintOp] {
  return [moveOp, addConstraintOp];
}
