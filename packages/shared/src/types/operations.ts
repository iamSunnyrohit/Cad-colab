import { ObjectId, GeometryObject, Constraint } from "./geometry";

export type OpType = "create" | "move" | "delete" | "addConstraint" | "removeConstraint";

export interface BaseOp {
  opId: string;
  docId: string;
  clientId: string;
  timestamp: number; // Lamport timestamp, assigned client-side
  seq?: number; // global sequence number, assigned server-side on commit
  refSeq: number; // the global sequence number this op was based on
  type: OpType;
}

export interface CreateOp extends BaseOp {
  type: "create";
  object: GeometryObject;
}

export interface MoveOp extends BaseOp {
  type: "move";
  objectId: ObjectId;
  delta: { dx: number; dy: number };
  /** which sub-point moved, for lines/rectangles with multiple handles (undefined = whole object) */
  pointIndex?: number;
}

export interface DeleteOp extends BaseOp {
  type: "delete";
  objectId: ObjectId;
}

export interface AddConstraintOp extends BaseOp {
  type: "addConstraint";
  constraint: Constraint;
}

export interface RemoveConstraintOp extends BaseOp {
  type: "removeConstraint";
  constraintId: string;
}

export type Op = CreateOp | MoveOp | DeleteOp | AddConstraintOp | RemoveConstraintOp;
