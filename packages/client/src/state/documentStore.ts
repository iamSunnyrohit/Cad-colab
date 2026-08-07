import { useState, useCallback } from "react";

// Phase 0: a minimal local store for canvas objects. This gets replaced by
// opQueue.ts + shared OT transforms in Phase 1 — kept dumb on purpose here.
export interface CanvasObject {
  _id?: string;
  type: "line" | "circle" | "rectangle";
  props: Record<string, number | number[]>;
}

export function useDocumentStore() {
  const [objects, setObjects] = useState<CanvasObject[]>([]);

  const addObject = useCallback((obj: CanvasObject) => {
    setObjects((prev) => [...prev, obj]);
  }, []);

  const updateObjectLocal = useCallback((index: number, props: CanvasObject["props"]) => {
    setObjects((prev) => prev.map((o, i) => (i === index ? { ...o, props } : o)));
  }, []);

  return { objects, setObjects, addObject, updateObjectLocal };
}
