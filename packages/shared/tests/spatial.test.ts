import { describe, it, expect } from "vitest";
import { getBoundingBox, boundsOverlap, filterVisibleObjects, snapToGrid, snapPointToGrid } from "../src/spatial/spatialIndex";
import { GeometryObject } from "../src/types/geometry";

describe("Spatial Indexing & Viewport Culling", () => {
  it("calculates accurate bounding box for shapes", () => {
    const circle: GeometryObject = {
      id: "c1",
      docId: "doc1",
      type: "circle",
      version: 0,
      props: { x: 100, y: 100, radius: 50 }
    };
    const circleBBox = getBoundingBox(circle);
    expect(circleBBox).toEqual({ minX: 50, minY: 50, maxX: 150, maxY: 150 });

    const rect: GeometryObject = {
      id: "r1",
      docId: "doc1",
      type: "rectangle",
      version: 0,
      props: { x: 0, y: 0, width: 200, height: 100 }
    };
    const rectBBox = getBoundingBox(rect);
    expect(rectBBox).toEqual({ minX: 0, minY: 0, maxX: 200, maxY: 100 });

    const line: GeometryObject = {
      id: "l1",
      docId: "doc1",
      type: "line",
      version: 0,
      props: { points: [10, 20, 110, 220] }
    };
    const lineBBox = getBoundingBox(line);
    expect(lineBBox).toEqual({ minX: 10, minY: 20, maxX: 110, maxY: 220 });
  });

  it("culls objects outside visible viewport bounds", () => {
    const objInside: GeometryObject = {
      id: "in",
      docId: "doc1",
      type: "circle",
      version: 0,
      props: { x: 50, y: 50, radius: 10 }
    };

    const objOutside: GeometryObject = {
      id: "out",
      docId: "doc1",
      type: "rectangle",
      version: 0,
      props: { x: 2000, y: 2000, width: 100, height: 100 }
    };

    const viewport = { minX: 0, minY: 0, maxX: 500, maxY: 500 };
    const visible = filterVisibleObjects([objInside, objOutside], viewport, 0);

    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("in");
  });

  it("snaps points to grid increments accurately", () => {
    expect(snapToGrid(14, 10)).toBe(10);
    expect(snapToGrid(16, 10)).toBe(20);

    const snapped = snapPointToGrid(23, 47, 10);
    expect(snapped).toEqual({ x: 20, y: 50 });
  });
});
