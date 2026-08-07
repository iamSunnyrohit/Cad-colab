import { AddConstraintOp } from "../../types/operations";

/**
 * Transforms two concurrent AddConstraintOps.
 * Since they commute and the server validates satisfiability chronologically,
 * we return them unchanged. Any contradictory constraint will be rejected
 * by the server validator.
 */
export function transformConstraintConstraint(
  opA: AddConstraintOp,
  opB: AddConstraintOp
): [AddConstraintOp, AddConstraintOp] {
  return [opA, opB];
}
