import { Op } from "../types/operations";
import { transformMoveMove } from "./transforms/moveMove";
import { transformMoveConstraint } from "./transforms/moveConstraint";
import { transformConstraintConstraint } from "./transforms/constraintConstraint";

/**
 * Central dispatcher: given two concurrent ops, return them in the order
 * they should be applied so all clients converge to the same state.
 */
export function transform(opA: Op, opB: Op): [Op, Op] {
  if (opA.type === "move" && opB.type === "move") {
    return transformMoveMove(opA, opB);
  }
  if (opA.type === "move" && opB.type === "addConstraint") {
    return transformMoveConstraint(opA, opB);
  }
  if (opA.type === "addConstraint" && opB.type === "move") {
    const [transformedMove, transformedConstraint] = transformMoveConstraint(opB, opA);
    return [transformedConstraint, transformedMove];
  }
  if (opA.type === "addConstraint" && opB.type === "addConstraint") {
    return transformConstraintConstraint(opA, opB);
  }

  // Fallback for other op-type combinations (e.g. delete, constraints)
  return opA.timestamp <= opB.timestamp ? [opA, opB] : [opB, opA];
}
