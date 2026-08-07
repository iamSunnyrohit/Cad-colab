import { EPSILON as _EPSILON, nearlyEqual as _nearlyEqual, pointsEqual as _pointsEqual } from "./geometry/epsilon";
import { transform as _transform } from "./ot/transform";
import { solveConstraints as _solveConstraints, computeResidualError as _computeResidualError } from "./geometry/solver";

export const EPSILON = _EPSILON;
export const nearlyEqual = _nearlyEqual;
export const pointsEqual = _pointsEqual;
export const transform = _transform;
export const solveConstraints = _solveConstraints;
export const computeResidualError = _computeResidualError;

export * from "./types/geometry";
export * from "./types/operations";
export * from "./types/presence";
export * from "./types/auth";
export * from "./spatial/spatialIndex";


