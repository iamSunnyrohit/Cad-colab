export type ObjectId = string;

export interface Point {
  x: number;
  y: number;
}

export type PrimitiveType = "line" | "circle" | "rectangle";

export interface BaseObject {
  id: ObjectId;
  docId: string;
  type: PrimitiveType;
  version: number; // bumped on every applied op, used for OT sequencing (Phase 1)
}

export interface LineObject extends BaseObject {
  type: "line";
  props: {
    points: number[];
    color?: string;
  };
}

export interface CircleObject extends BaseObject {
  type: "circle";
  props: {
    x: number;
    y: number;
    radius: number;
    color?: string;
  };
}

export interface RectangleObject extends BaseObject {
  type: "rectangle";
  props: {
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
  };
}

export type GeometryObject = LineObject | CircleObject | RectangleObject;

// Constraint types are stubbed for Phase 2
export type ConstraintKind = "coincident" | "parallel" | "perpendicular" | "fixedDistance";

export interface Constraint {
  id: string;
  kind: ConstraintKind;
  refs: ObjectId[];
  params?: Record<string, number>;
}
