export const EPSILON = 1e-4;

export function nearlyEqual(a: number, b: number, eps: number = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

export function pointsEqual(
  a: { x: number; y: number },
  b: { x: number; y: number },
  eps: number = EPSILON
): boolean {
  return nearlyEqual(a.x, b.x, eps) && nearlyEqual(a.y, b.y, eps);
}
