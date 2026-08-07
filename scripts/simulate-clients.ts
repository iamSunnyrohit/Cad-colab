import "dotenv/config";
import mongoose from "mongoose";
import { io as ClientSocket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { DocumentModel } from "../packages/server/src/models/Document";
import { ObjectEntity } from "../packages/server/src/models/ObjectEntity";
import { OperationModel } from "../packages/server/src/models/Operation";
import { Op, MoveOp } from "@cad-collab/shared";
import { useOpQueue } from "../packages/client/src/state/opQueue";

// A mock React hook container to run our useOpQueue in raw JS/TS script
class ClientContainer {
  public clientId: string;
  public syncedObjects: any[] = [];
  public pendingOps: Op[] = [];
  public lastSyncedSeq = 0;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  public init(objs: any[], seq: number) {
    this.syncedObjects = JSON.parse(JSON.stringify(objs));
    this.pendingOps = [];
    this.lastSyncedSeq = seq;
  }

  public applyLocal(op: Op) {
    this.pendingOps.push(op);
  }

  public applyServer(serverOp: Op) {
    const { transform } = require("@cad-collab/shared");
    const { applyOp } = require("../packages/client/src/state/opQueue");

    if (serverOp.clientId === this.clientId) {
      const index = this.pendingOps.findIndex(o => o.opId === serverOp.opId);
      if (index !== -1) {
        this.pendingOps.splice(index, 1);
      }
      this.syncedObjects = applyOp(this.syncedObjects, serverOp);
    } else {
      let opToApply = { ...serverOp };
      const nextPendingTransformed: Op[] = [];

      for (const pendingOp of this.pendingOps) {
        const [first, second] = transform(opToApply, pendingOp);
        if (first.opId === pendingOp.opId) {
          opToApply = second;
          nextPendingTransformed.push(first);
        } else {
          opToApply = first;
          nextPendingTransformed.push(second);
        }
      }

      this.syncedObjects = applyOp(this.syncedObjects, opToApply);
      this.pendingOps = nextPendingTransformed;
    }
    this.lastSyncedSeq = Math.max(this.lastSyncedSeq, serverOp.seq || 0);
  }

  public getVisibleObjects() {
    const { applyOp } = require("../packages/client/src/state/opQueue");
    let current = this.syncedObjects;
    for (const op of this.pendingOps) {
      current = applyOp(current, op);
    }
    return current;
  }
}

async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/cad_collab";
  console.log(`[test] Connecting to database at ${mongoUri}`);
  await mongoose.connect(mongoUri);

  // 1. Create a clean test document and a circle
  const doc = await DocumentModel.create({ name: "OT Convergence Test", version: 0 });
  const docId = doc._id.toString();

  const circleId = new mongoose.Types.ObjectId().toString();
  await ObjectEntity.create({
    _id: circleId,
    docId,
    type: "circle",
    version: 0,
    props: { x: 100, y: 100, radius: 40 }
  });
  console.log(`[test] Initialized test document ${docId} with circle at (100, 100)`);

  const initialObjects = [{
    _id: circleId,
    type: "circle",
    props: { x: 100, y: 100, radius: 40 }
  }];

  // 2. Initialize 3 headless clients
  const clientA = new ClientContainer("clientA");
  const clientB = new ClientContainer("clientB");
  const clientC = new ClientContainer("clientC");

  clientA.init(initialObjects, 0);
  clientB.init(initialObjects, 0);
  clientC.init(initialObjects, 0);

  const socketA = ClientSocket("http://localhost:4000");
  const socketB = ClientSocket("http://localhost:4000");
  const socketC = ClientSocket("http://localhost:4000");

  let acksReceived = 0;
  const totalOpsExpected = 3;

  const onOpReceived = (client: ClientContainer, op: Op) => {
    client.applyServer(op);
    if (op.seq === totalOpsExpected) {
      acksReceived++;
    }
  };

  // Wire up socket event handlers
  socketA.on("op-applied", (op: Op) => onOpReceived(clientA, op));
  socketB.on("op-applied", (op: Op) => onOpReceived(clientB, op));
  socketC.on("op-applied", (op: Op) => onOpReceived(clientC, op));

  // Join document room
  socketA.emit("join-document", docId);
  socketB.emit("join-document", docId);
  socketC.emit("join-document", docId);

  // Wait 1 second for connections and room joins
  await new Promise(r => setTimeout(r, 1000));

  // 3. Construct concurrent operations
  // Client A moves: dx=10, dy=5
  const opA: MoveOp = {
    opId: uuidv4(),
    docId,
    clientId: "clientA",
    timestamp: 100,
    refSeq: 0,
    type: "move",
    objectId: circleId,
    delta: { dx: 10, dy: 5 }
  };

  // Client B moves: dx=-5, dy=20
  const opB: MoveOp = {
    opId: uuidv4(),
    docId,
    clientId: "clientB",
    timestamp: 200,
    refSeq: 0,
    type: "move",
    objectId: circleId,
    delta: { dx: -5, dy: 20 }
  };

  // Client C moves: dx=15, dy=-10
  const opC: MoveOp = {
    opId: uuidv4(),
    docId,
    clientId: "clientC",
    timestamp: 150,
    refSeq: 0,
    type: "move",
    objectId: circleId,
    delta: { dx: 15, dy: -10 }
  };

  // 4. Simulate concurrent emission
  console.log("[test] Emitting 3 concurrent operations...");
  clientA.applyLocal(opA);
  clientB.applyLocal(opB);
  clientC.applyLocal(opC);

  socketA.emit("submit-op", opA);
  socketB.emit("submit-op", opB);
  socketC.emit("submit-op", opC);

  // 5. Wait for all clients to finish receiving all 3 operations
  let attempts = 0;
  while (acksReceived < 3 && attempts < 20) {
    await new Promise(r => setTimeout(r, 250));
    attempts++;
  }

  // 6. Check convergence
  const finalObjA = clientA.getVisibleObjects()[0];
  const finalObjB = clientB.getVisibleObjects()[0];
  const finalObjC = clientC.getVisibleObjects()[0];

  // Fetch final database snapshot
  const dbObj = await ObjectEntity.findById(circleId);

  console.log("[test] Final client states:");
  console.log(`Client A circle: x=${finalObjA.props.x}, y=${finalObjA.props.y}`);
  console.log(`Client B circle: x=${finalObjB.props.x}, y=${finalObjB.props.y}`);
  console.log(`Client C circle: x=${finalObjC.props.x}, y=${finalObjC.props.y}`);
  console.log(`Database circle: x=${dbObj?.props.x}, y=${dbObj?.props.y}`);

  // Expected position: initial 100 + sum of deltas (10 - 5 + 15) = 120
  const expectedX = 100 + 10 - 5 + 15;
  const expectedY = 100 + 5 + 20 - 10;

  // Clean up
  socketA.disconnect();
  socketB.disconnect();
  socketC.disconnect();
  await mongoose.disconnect();

  if (
    finalObjA.props.x === expectedX && finalObjA.props.y === expectedY &&
    finalObjB.props.x === expectedX && finalObjB.props.y === expectedY &&
    finalObjC.props.x === expectedX && finalObjC.props.y === expectedY &&
    dbObj?.props.x === expectedX && dbObj?.props.y === expectedY
  ) {
    console.log("✅ SUCCESS: All clients and the database have converged on the identical final coordinates!");
    process.exit(0);
  } else {
    console.error("❌ FAILURE: Coordinate mismatch! Convergence failed.");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Error running simulation:", err);
  process.exit(1);
});
