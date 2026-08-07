import { solveConstraints, computeResidualError, GeometryObject, Constraint } from "@cad-collab/shared";

/**
 * Validates if a new constraint can be satisfied alongside the existing constraints of the document.
 * Checks for:
 * 1. Dangling references (referenced object must exist).
 * 2. Satisfiability (solver must converge to a residual error below 0.1).
 */
export function validateConstraint(
  objects: GeometryObject[],
  existingConstraints: Constraint[],
  newConstraint: Constraint
): boolean {
  // 1. Check for dangling references
  const objectIds = new Set(objects.map(o => o.id));
  for (const ref of newConstraint.refs) {
    const objectId = ref.split(":")[0];
    if (!objectIds.has(objectId)) {
      return false; // Target object does not exist
    }
  }

  // 2. Solve the full constraint system and check error
  const allConstraints = [...existingConstraints, newConstraint];
  const solved = solveConstraints(objects, allConstraints, {});
  const maxError = computeResidualError(solved, allConstraints);

  return maxError <= 0.1;
}
