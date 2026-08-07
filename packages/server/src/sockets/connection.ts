import { Server, Socket } from "socket.io";
import { processIncomingOp, documentQueue } from "../ot/otServer";

/**
 * Phase 0/1: sockets handle room join/leave and op broadcasting/transform sequencing.
 */
export function registerConnectionHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on("join-document", (docId: string) => {
      socket.join(docId);
      socket.to(docId).emit("peer-joined", { socketId: socket.id });
    });

    socket.on("leave-document", (docId: string) => {
      socket.leave(docId);
      socket.to(docId).emit("peer-left", { socketId: socket.id });
    });

    socket.on("submit-op", async (op: any) => {
      try {
        const finalizedOp = await documentQueue.enqueue(op.docId, () => processIncomingOp(op));
        io.to(op.docId).emit("op-applied", finalizedOp);
      } catch (err) {
        console.error(`[socket] error processing op:`, err);
        socket.emit("op-error", { opId: op?.opId, error: String(err) });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}
