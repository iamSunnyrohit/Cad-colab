import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { PeerPresence, PresenceUpdatePayload, CursorPosition } from "@cad-collab/shared";

export function usePresence(socket: Socket | null, docId: string | null, localClientId: string, userName?: string) {
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "reconnecting">("disconnected");
  
  const lastCursorRef = useRef<CursorPosition | null>(null);

  useEffect(() => {
    if (!socket || !docId) return;

    if (socket.connected) {
      setConnectionStatus("connected");
      socket.emit("join-document", { docId, clientId: localClientId, userName });
    }

    const onConnect = () => {
      setConnectionStatus("connected");
      socket.emit("join-document", { docId, clientId: localClientId, userName });
    };

    const onDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const onReconnectAttempt = () => {
      setConnectionStatus("reconnecting");
    };

    const onPresenceState = (data: { peers: PeerPresence[] }) => {
      const filtered = data.peers.filter(p => p.clientId !== localClientId);
      setPeers(filtered);
    };

    const onPeerJoined = (peer: PeerPresence) => {
      if (peer.clientId === localClientId) return;
      setPeers(prev => [...prev.filter(p => p.socketId !== peer.socketId), peer]);
    };

    const onPresenceUpdate = (updatedPeer: PeerPresence) => {
      if (updatedPeer.clientId === localClientId) return;
      setPeers(prev => {
        const index = prev.findIndex(p => p.socketId === updatedPeer.socketId);
        if (index !== -1) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedPeer };
          return next;
        }
        return [...prev, updatedPeer];
      });
    };

    const onPeerLeft = (data: { socketId: string; clientId?: string }) => {
      setPeers(prev => prev.filter(p => p.socketId !== data.socketId && p.clientId !== data.clientId));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io?.on("reconnect_attempt", onReconnectAttempt);

    socket.on("presence-state", onPresenceState);
    socket.on("peer-joined", onPeerJoined);
    socket.on("presence-update", onPresenceUpdate);
    socket.on("peer-left", onPeerLeft);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io?.off("reconnect_attempt", onReconnectAttempt);
      socket.off("presence-state", onPresenceState);
      socket.off("peer-joined", onPeerJoined);
      socket.off("presence-update", onPresenceUpdate);
      socket.off("peer-left", onPeerLeft);
    };
  }, [socket, docId, localClientId, userName]);

  const updateLocalCursor = useCallback((cursor: CursorPosition) => {
    if (!socket || !socket.connected) return;
    
    // Throttled / debounced update if needed (here only send if position changed by > 2px)
    if (
      lastCursorRef.current &&
      Math.abs(lastCursorRef.current.x - cursor.x) < 2 &&
      Math.abs(lastCursorRef.current.y - cursor.y) < 2
    ) {
      return;
    }

    lastCursorRef.current = cursor;
    const payload: PresenceUpdatePayload = {
      clientId: localClientId,
      cursor
    };
    socket.emit("presence-update", payload);
  }, [socket, localClientId]);

  return {
    peers,
    connectionStatus,
    updateLocalCursor
  };
}
