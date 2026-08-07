import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientSocket, Socket as ClientSocketType } from "socket.io-client";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { documentsRouter } from "../src/routes/documents";
import { registerConnectionHandlers } from "../src/sockets/connection";
import { OperationModel } from "../src/models/Operation";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

describe("Phase 3 Resilience & Presence Tests", () => {
  let app: express.Express;
  let httpServer: any;
  let io: SocketIOServer;
  let port: number;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/cad_collab_test";
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }).catch((err) => {
        console.warn("MongoDB connection skipped in test:", err.message);
      });
    }

    app = express();
    app.use(express.json());
    app.use("/api/documents", documentsRouter);

    httpServer = createServer(app);
    io = new SocketIOServer(httpServer);
    registerConnectionHandlers(io);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });
  }, 10000);

  afterAll(async () => {
    if (io) io.close();
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it("fetches catch-up operations after sinceSeq", async () => {
    const docId = `test-doc-${Date.now()}`;

    if (mongoose.connection.readyState !== 0) {
      // Seed mock operations in database if connected
      await OperationModel.create([
        { opId: `op1-${Date.now()}`, docId, clientId: "c1", type: "create", args: {}, timestamp: Date.now(), seq: 1, refSeq: 0 },
        { opId: `op2-${Date.now()}`, docId, clientId: "c1", type: "move", args: { delta: { dx: 10, dy: 10 } }, timestamp: Date.now(), seq: 2, refSeq: 1 },
        { opId: `op3-${Date.now()}`, docId, clientId: "c2", type: "move", args: { delta: { dx: 5, dy: 5 } }, timestamp: Date.now(), seq: 3, refSeq: 2 }
      ]);
    }

    const res = await fetch(`http://localhost:${port}/api/documents/${docId}/ops?sinceSeq=1`);
    const data = await res.json();

    expect(data.ops).toBeDefined();
    if (mongoose.connection.readyState !== 0) {
      expect(data.ops.length).toBeGreaterThanOrEqual(2);
      expect(data.ops[0].seq).toBe(2);
      expect(data.ops[1].seq).toBe(3);
    }
  });

  it("exchanges room presence state over WebSockets", async () => {
    const docId = `room-${Date.now()}`;
    const client1: ClientSocketType = ClientSocket(`http://localhost:${port}`);
    const client2: ClientSocketType = ClientSocket(`http://localhost:${port}`);

    await new Promise<void>((resolve) => client1.on("connect", resolve));
    await new Promise<void>((resolve) => client2.on("connect", resolve));

    const peerJoinedPromise = new Promise<any>((resolve) => {
      client1.on("peer-joined", resolve);
    });

    client1.emit("join-document", { docId, clientId: "user1", userName: "Alice" });
    // Small delay to ensure client1 room join is processed by server
    await new Promise((r) => setTimeout(r, 100));

    client2.emit("join-document", { docId, clientId: "user2", userName: "Bob" });

    const joinedPeer = await peerJoinedPromise;
    expect(joinedPeer.userName).toBe("Bob");
    expect(joinedPeer.clientId).toBe("user2");

    client1.disconnect();
    client2.disconnect();
  }, 15000);
});
