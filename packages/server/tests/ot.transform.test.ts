import { describe, it, expect } from "vitest";
import { transform } from "@cad-collab/shared";
import type { MoveOp } from "@cad-collab/shared";

function move(objectId: string, dx: number, dy: number, timestamp: number, clientId: string): MoveOp {
  return {
    opId: `${clientId}-${timestamp}`,
    docId: "doc1",
    clientId,
    timestamp,
    type: "move",
    objectId,
    delta: { dx, dy }
  };
}

describe("transform: move <-> move", () => {
  it("lets ops on different objects commute", () => {
    const a = move("obj1", 5, 0, 1, "clientA");
    const b = move("obj2", 0, 5, 2, "clientB");
    const [first, second] = transform(a, b);
    expect(first.objectId).toBe("obj1");
    expect(second.objectId).toBe("obj2");
  });

  it("sequences ops on the same object by timestamp", () => {
    const early = move("obj1", 5, 0, 1, "clientA");
    const late = move("obj1", 0, 5, 2, "clientB");
    const [first, second] = transform(late, early);
    expect(first.timestamp).toBe(1);
    expect(second.timestamp).toBe(2);
  });
});
