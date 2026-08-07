import { Server, Socket } from "socket.io";
import { processIncomingOp, documentQueue } from "../ot/otServer";
import { PeerPresence, PresenceUpdatePayload } from "@cad-collab/shared";

// Map<docId, Map<socketId, PeerPresence>>
const roomPresenceMap = new Map<string, Map<string, PeerPresence>>();

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"
];

function getRandomColor(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_COLORS.length;
  return PRESET_COLORS[index];
}

export function registerConnectionHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    let currentDocId: string | null = null;
    let currentClientId: string | null = null;

    console.log(`[socket] connected: ${socket.id}`);

    socket.on("join-document", (data: string | { docId: string; clientId: string; userName?: string }) => {
      const docId = typeof data === "string" ? data : data.docId;
      const clientId = typeof data === "object" ? data.clientId : socket.id;
      const userName = (typeof data === "object" && data.userName) ? data.userName : `User ${clientId.slice(0, 4)}`;

      currentDocId = docId;
      currentClientId = clientId;

      socket.join(docId);

      if (!roomPresenceMap.has(docId)) {
        roomPresenceMap.set(docId, new Map());
      }
      const docPeers = roomPresenceMap.get(docId)!;

      const peer: PeerPresence = {
        clientId,
        socketId: socket.id,
        userName,
        color: getRandomColor(clientId),
        lastActive: Date.now()
      };
      docPeers.set(socket.id, peer);

      // Send initial room presence snapshot to newly joined user
      socket.emit("presence-state", { peers: Array.from(docPeers.values()) });

      // Notify others in room of new peer
      socket.to(docId).emit("peer-joined", peer);
    });

    socket.on("presence-update", (payload: PresenceUpdatePayload) => {
      if (!currentDocId) return;
      const docPeers = roomPresenceMap.get(currentDocId);
      if (!docPeers) return;

      const peer = docPeers.get(socket.id);
      if (peer) {
        if (payload.cursor !== undefined) peer.cursor = payload.cursor;
        if (payload.selectedObjectId !== undefined) peer.selectedObjectId = payload.selectedObjectId;
        if (payload.userName) peer.userName = payload.userName;
        if (payload.color) peer.color = payload.color;
        peer.lastActive = Date.now();

        socket.to(currentDocId).emit("presence-update", peer);
      }
    });

    socket.on("leave-document", (docId: string) => {
      socket.leave(docId);
      const docPeers = roomPresenceMap.get(docId);
      if (docPeers) {
        docPeers.delete(socket.id);
        if (docPeers.size === 0) {
          roomPresenceMap.delete(docId);
        }
      }
      socket.to(docId).emit("peer-left", { socketId: socket.id, clientId: currentClientId });
      currentDocId = null;
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
      if (currentDocId) {
        const docPeers = roomPresenceMap.get(currentDocId);
        if (docPeers) {
          docPeers.delete(socket.id);
          if (docPeers.size === 0) {
            roomPresenceMap.delete(currentDocId);
          }
        }
        socket.to(currentDocId).emit("peer-left", { socketId: socket.id, clientId: currentClientId });
      }
    });
  });
}
