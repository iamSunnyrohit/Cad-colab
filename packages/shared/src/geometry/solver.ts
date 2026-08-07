import { GeometryObject, Constraint } from "../types/geometry";

interface PointState {
  x: number;
  y: number;
  fixed: boolean;
}

export function solveConstraints(
  objects: GeometryObject[],
  constraints: Constraint[],
  fixedPoints: Record<string, { x: number; y: number }>,
  iterations = 50
): GeometryObject[] {
  // 1. Create a deep copy of the objects
  const newObjects = JSON.parse(JSON.stringify(objects)) as GeometryObject[];
  const objectsMap = new Map<string, GeometryObject>();
  for (const obj of newObjects) {
    objectsMap.set(obj.id, obj);
  }

  // 2. Initialize a map of all point keys to their x, y coordinates and fixed status
  const points = new Map<string, PointState>();

  // Initialize from objects
  for (const obj of newObjects) {
    if (obj.type === "circle") {
      points.set(`${obj.id}:center`, { x: obj.props.x, y: obj.props.y, fixed: false });
    } else if (obj.type === "rectangle") {
      points.set(`${obj.id}:topLeft`, { x: obj.props.x, y: obj.props.y, fixed: false });
    } else if (obj.type === "line") {
      points.set(`${obj.id}:0`, { x: obj.props.points[0], y: obj.props.points[1], fixed: false });
      points.set(`${obj.id}:1`, { x: obj.props.points[2], y: obj.props.points[3], fixed: false });
    }
  }

  // Apply user-fixed/dragged points
  for (const [key, target] of Object.entries(fixedPoints)) {
    const pt = points.get(key);
    if (pt) {
      pt.x = target.x;
      pt.y = target.y;
      pt.fixed = true;
    } else {
      points.set(key, { x: target.x, y: target.y, fixed: true });
    }
  }

  // Helper function to rotate a line segment
  const rotateLine = (lineId: string, dTheta: number) => {
    const p0 = points.get(`${lineId}:0`);
    const p1 = points.get(`${lineId}:1`);
    if (!p0 || !p1) return;

    let cx = (p0.x + p1.x) / 2;
    let cy = (p0.y + p1.y) / 2;

    if (p0.fixed && !p1.fixed) {
      cx = p0.x;
      cy = p0.y;
    } else if (p1.fixed && !p0.fixed) {
      cx = p1.x;
      cy = p1.y;
    } else if (p0.fixed && p1.fixed) {
      return; // Cannot rotate a fully fixed line
    }

    const cos = Math.cos(dTheta);
    const sin = Math.sin(dTheta);

    if (!p0.fixed) {
      const dx0 = p0.x - cx;
      const dy0 = p0.y - cy;
      p0.x = cx + (dx0 * cos - dy0 * sin);
      p0.y = cy + (dx0 * sin + dy0 * cos);
    }
    if (!p1.fixed) {
      const dx1 = p1.x - cx;
      const dy1 = p1.y - cy;
      p1.x = cx + (dx1 * cos - dy1 * sin);
      p1.y = cy + (dx1 * sin + dy1 * cos);
    }
  };

  // 3. Iterative relaxation solver
  for (let iter = 0; iter < iterations; iter++) {
    for (const c of constraints) {
      if (c.kind === "coincident") {
        if (c.refs.length < 2) continue;
        const pA = points.get(c.refs[0]);
        const pB = points.get(c.refs[1]);
        if (!pA || !pB) continue;

        const isHeavy = (key: string) => key.endsWith(":center") || key.endsWith(":topLeft");
        const wA = isHeavy(c.refs[0]) ? 1.0 : 0.0;
        const wB = isHeavy(c.refs[1]) ? 1.0 : 0.0;

        if (pA.fixed && pB.fixed) continue;
        if (pA.fixed) {
          pB.x = pA.x;
          pB.y = pA.y;
        } else if (pB.fixed) {
          pA.x = pB.x;
          pA.y = pB.y;
        } else if (wA > wB) {
          pB.x = pA.x;
          pB.y = pA.y;
        } else if (wB > wA) {
          pA.x = pB.x;
          pA.y = pB.y;
        } else {
          const mx = (pA.x + pB.x) / 2;
          const my = (pA.y + pB.y) / 2;
          pA.x = mx;
          pA.y = my;
          pB.x = mx;
          pB.y = my;
        }
      } else if (c.kind === "fixedDistance") {
        if (c.refs.length < 2) continue;
        const pA = points.get(c.refs[0]);
        const pB = points.get(c.refs[1]);
        if (!pA || !pB) continue;

        const targetDist = c.params?.distance ?? 100;
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1e-6) continue;

        const diff = dist - targetDist;
        const ux = (dx / dist) * diff;
        const uy = (dy / dist) * diff;

        if (pA.fixed && pB.fixed) continue;
        if (pA.fixed) {
          pB.x -= ux;
          pB.y -= uy;
        } else if (pB.fixed) {
          pA.x += ux;
          pA.y += uy;
        } else {
          pA.x += ux / 2;
          pA.y += uy / 2;
          pB.x -= ux / 2;
          pB.y -= uy / 2;
        }
      } else if (c.kind === "parallel" || c.kind === "perpendicular") {
        if (c.refs.length < 2) continue;
        const lineId1 = c.refs[0];
        const lineId2 = c.refs[1];

        const l1p0 = points.get(`${lineId1}:0`);
        const l1p1 = points.get(`${lineId1}:1`);
        const l2p0 = points.get(`${lineId2}:0`);
        const l2p1 = points.get(`${lineId2}:1`);

        if (!l1p0 || !l1p1 || !l2p0 || !l2p1) continue;

        const theta1 = Math.atan2(l1p1.y - l1p0.y, l1p1.x - l1p0.x);
        const theta2 = Math.atan2(l2p1.y - l2p0.y, l2p1.x - l2p0.x);

        let targetDiff = 0; // parallel
        if (c.kind === "perpendicular") {
          targetDiff = Math.PI / 2;
        }

        let diff = theta2 - theta1 - targetDiff;
        // Normalize error to [-PI/2, PI/2]
        while (diff > Math.PI / 2) diff -= Math.PI;
        while (diff < -Math.PI / 2) diff += Math.PI;

        const l1Fixed = (l1p0.fixed && l1p1.fixed);
        const l2Fixed = (l2p0.fixed && l2p1.fixed);

        if (l1Fixed && l2Fixed) continue;
        if (l1Fixed) {
          rotateLine(lineId2, -diff);
        } else if (l2Fixed) {
          rotateLine(lineId1, diff);
        } else {
          rotateLine(lineId1, diff / 2);
          rotateLine(lineId2, -diff / 2);
        }
      }
    }
  }

  // 4. Update coordinates back into objects
  for (const obj of newObjects) {
    if (obj.type === "circle") {
      const pt = points.get(`${obj.id}:center`);
      if (pt) {
        obj.props.x = pt.x;
        obj.props.y = pt.y;
      }
    } else if (obj.type === "rectangle") {
      const pt = points.get(`${obj.id}:topLeft`);
      if (pt) {
        obj.props.x = pt.x;
        obj.props.y = pt.y;
      }
    } else if (obj.type === "line") {
      const pt0 = points.get(`${obj.id}:0`);
      const pt1 = points.get(`${obj.id}:1`);
      if (pt0 && pt1) {
        obj.props.points = [pt0.x, pt0.y, pt1.x, pt1.y];
      }
    }
  }

  return newObjects;
}

export function computeResidualError(
  objects: GeometryObject[],
  constraints: Constraint[]
): number {
  const points = new Map<string, { x: number; y: number }>();
  for (const obj of objects) {
    if (obj.type === "circle") {
      points.set(`${obj.id}:center`, { x: obj.props.x, y: obj.props.y });
    } else if (obj.type === "rectangle") {
      points.set(`${obj.id}:topLeft`, { x: obj.props.x, y: obj.props.y });
    } else if (obj.type === "line") {
      points.set(`${obj.id}:0`, { x: obj.props.points[0], y: obj.props.points[1] });
      points.set(`${obj.id}:1`, { x: obj.props.points[2], y: obj.props.points[3] });
    }
  }

  let maxError = 0;

  for (const c of constraints) {
    if (c.kind === "coincident") {
      if (c.refs.length < 2) continue;
      const pA = points.get(c.refs[0]);
      const pB = points.get(c.refs[1]);
      if (!pA || !pB) continue;
      const dist = Math.sqrt((pB.x - pA.x) ** 2 + (pB.y - pA.y) ** 2);
      maxError = Math.max(maxError, dist);
    } else if (c.kind === "fixedDistance") {
      if (c.refs.length < 2) continue;
      const pA = points.get(c.refs[0]);
      const pB = points.get(c.refs[1]);
      if (!pA || !pB) continue;
      const targetDist = c.params?.distance ?? 100;
      const dist = Math.sqrt((pB.x - pA.x) ** 2 + (pB.y - pA.y) ** 2);
      maxError = Math.max(maxError, Math.abs(dist - targetDist));
    } else if (c.kind === "parallel" || c.kind === "perpendicular") {
      if (c.refs.length < 2) continue;
      const lineId1 = c.refs[0];
      const lineId2 = c.refs[1];

      const l1p0 = points.get(`${lineId1}:0`);
      const l1p1 = points.get(`${lineId1}:1`);
      const l2p0 = points.get(`${lineId2}:0`);
      const l2p1 = points.get(`${lineId2}:1`);

      if (!l1p0 || !l1p1 || !l2p0 || !l2p1) continue;

      const theta1 = Math.atan2(l1p1.y - l1p0.y, l1p1.x - l1p0.x);
      const theta2 = Math.atan2(l2p1.y - l2p0.y, l2p1.x - l2p0.x);

      let targetDiff = 0;
      if (c.kind === "perpendicular") {
        targetDiff = Math.PI / 2;
      }

      let diff = theta2 - theta1 - targetDiff;
      while (diff > Math.PI / 2) diff -= Math.PI;
      while (diff < -Math.PI / 2) diff += Math.PI;

      const errorVal = Math.abs(diff) * 100; // Normalized error
      maxError = Math.max(maxError, errorVal);
    }
  }

  return maxError;
}
