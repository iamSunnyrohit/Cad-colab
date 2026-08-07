import { GeometryObject } from "../types/geometry";

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculates axis-aligned bounding box (AABB) for any geometry object.
 */
export function getBoundingBox(obj: GeometryObject): BoundingBox {
  if (obj.type === "circle") {
    const { x, y, radius } = obj.props;
    return {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius
    };
  }
  if (obj.type === "rectangle") {
    const { x, y, width, height } = obj.props;
    return {
      minX: Math.min(x, x + width),
      minY: Math.min(y, y + height),
      maxX: Math.max(x, x + width),
      maxY: Math.max(y, y + height)
    };
  }
  if (obj.type === "line") {
    const pts = obj.props.points || [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      const px = pts[i];
      const py = pts[i + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    return { minX, minY, maxX, maxY };
  }
  return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

/**
 * Checks if two axis-aligned bounding boxes overlap.
 */
export function boundsOverlap(a: BoundingBox, b: ViewportBounds): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}

/**
 * Filters objects to return only those intersecting the visible viewport bounding box (Culling).
 */
export function filterVisibleObjects<T extends GeometryObject>(
  objects: T[],
  viewport: ViewportBounds,
  margin: number = 50
): T[] {
  const paddedViewport: ViewportBounds = {
    minX: viewport.minX - margin,
    minY: viewport.minY - margin,
    maxX: viewport.maxX + margin,
    maxY: viewport.maxY + margin
  };

  return objects.filter((obj) => {
    const bbox = getBoundingBox(obj);
    return boundsOverlap(bbox, paddedViewport);
  });
}

/**
 * Snaps a coordinate value to nearest grid step size (e.g. 10px).
 */
export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps point (x, y) to nearest grid increment.
 */
export function snapPointToGrid(x: number, y: number, gridSize: number = 10): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize)
  };
}
