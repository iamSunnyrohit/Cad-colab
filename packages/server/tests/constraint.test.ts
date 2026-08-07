import { describe, it, expect } from "vitest";
import { solveConstraints } from "@cad-collab/shared";
import type { GeometryObject, Constraint, LineObject, CircleObject } from "@cad-collab/shared";
import { validateConstraint } from "../src/services/constraintValidator";

describe("constraint solver and validator", () => {
  const createCircle = (id: string, x: number, y: number): GeometryObject => ({
    id,
    docId: "doc1",
    type: "circle",
    version: 0,
    props: { x, y, radius: 20 }
  });

  const createLine = (id: string, x1: number, y1: number, x2: number, y2: number): GeometryObject => ({
    id,
    docId: "doc1",
    type: "line",
    version: 0,
    props: { points: [x1, y1, x2, y2] }
  });

  it("snaps a line endpoint to a circle center using coincident constraint", () => {
    const circle = createCircle("circle1", 100, 100);
    const line = createLine("line1", 200, 200, 300, 300);

    const constraint: Constraint = {
      id: "c1",
      kind: "coincident",
      refs: ["circle1:center", "line1:0"]
    };

    // Since circle1 is heavy (center) and line1:0 is light, line1:0 should snap to circle1
    const solved = solveConstraints([circle, line], [constraint], {});
    const solvedLine = solved.find(o => o.id === "line1") as LineObject;

    expect(solvedLine.props.points[0]).toBeCloseTo(100);
    expect(solvedLine.props.points[1]).toBeCloseTo(100);
  });

  it("propagates circle movement to a coincident line endpoint", () => {
    const circle = createCircle("circle1", 100, 100);
    const line = createLine("line1", 100, 100, 200, 200); // already snapped

    const constraint: Constraint = {
      id: "c1",
      kind: "coincident",
      refs: ["circle1:center", "line1:0"]
    };

    // Circle is dragged to 150, 150 (fixed point)
    const fixedPoints = {
      "circle1:center": { x: 150, y: 150 }
    };

    const solved = solveConstraints([circle, line], [constraint], fixedPoints);
    const solvedCircle = solved.find(o => o.id === "circle1") as CircleObject;
    const solvedLine = solved.find(o => o.id === "line1") as LineObject;

    expect(solvedCircle.props.x).toBe(150);
    expect(solvedCircle.props.y).toBe(150);
    expect(solvedLine.props.points[0]).toBeCloseTo(150);
    expect(solvedLine.props.points[1]).toBeCloseTo(150);
  });

  it("satisfies a fixed distance constraint between points", () => {
    const p1 = createCircle("p1", 0, 0);
    const p2 = createCircle("p2", 50, 0); // distance 50

    const constraint: Constraint = {
      id: "c1",
      kind: "fixedDistance",
      refs: ["p1:center", "p2:center"],
      params: { distance: 100 }
    };

    const solved = solveConstraints([p1, p2], [constraint], {
      "p1:center": { x: 0, y: 0 } // p1 fixed
    });
    const solvedP2 = solved.find(o => o.id === "p2") as CircleObject;

    expect(solvedP2.props.x).toBeCloseTo(100);
    expect(solvedP2.props.y).toBeCloseTo(0);
  });

  it("aligns two line segments to be parallel", () => {
    const l1 = createLine("l1", 0, 0, 100, 0); // horizontal (angle 0)
    const l2 = createLine("l2", 0, 10, 50, 60); // diagonal (angle ~45 deg)

    const constraint: Constraint = {
      id: "c1",
      kind: "parallel",
      refs: ["l1", "l2"]
    };

    // l1 is fixed
    const solved = solveConstraints([l1, l2], [constraint], {
      "l1:0": { x: 0, y: 0 },
      "l1:1": { x: 100, y: 0 }
    });
    const solvedL2 = solved.find(o => o.id === "l2") as LineObject;

    // solvedL2 should be horizontal
    const dy = solvedL2.props.points[3] - solvedL2.props.points[1];
    expect(dy).toBeCloseTo(0);
  });

  it("aligns two line segments to be perpendicular", () => {
    const l1 = createLine("l1", 0, 0, 100, 0); // horizontal (angle 0)
    const l2 = createLine("l2", 0, 10, 100, 10); // horizontal (angle 0)

    const constraint: Constraint = {
      id: "c1",
      kind: "perpendicular",
      refs: ["l1", "l2"]
    };

    // l1 is fixed
    const solved = solveConstraints([l1, l2], [constraint], {
      "l1:0": { x: 0, y: 0 },
      "l1:1": { x: 100, y: 0 }
    });
    const solvedL2 = solved.find(o => o.id === "l2") as LineObject;

    // solvedL2 should be vertical (orthogonal to horizontal L1)
    const dx = solvedL2.props.points[2] - solvedL2.props.points[0];
    expect(dx).toBeCloseTo(0);
  });

  it("validates constraint satisfiability", () => {
    const p1 = createCircle("p1", 0, 0);
    const p2 = createCircle("p2", 50, 0);

    const c1: Constraint = {
      id: "c1",
      kind: "fixedDistance",
      refs: ["p1:center", "p2:center"],
      params: { distance: 100 }
    };

    // Valid constraint is satisfiable
    const valid = validateConstraint([p1, p2], [], c1);
    expect(valid).toBe(true);

    // Contradictory concurrent constraint on same points is rejected
    const c2: Constraint = {
      id: "c2",
      kind: "fixedDistance",
      refs: ["p1:center", "p2:center"],
      params: { distance: 200 }
    };
    const invalid = validateConstraint([p1, p2], [c1], c2);
    expect(invalid).toBe(false);
  });
});
