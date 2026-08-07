import { solveConstraints } from "@cad-collab/shared";

self.onmessage = (e: MessageEvent) => {
  const { objects, constraints, fixedPoints } = e.data;
  const solved = solveConstraints(objects, constraints, fixedPoints);
  self.postMessage({ objects: solved });
};
