export interface CursorPosition {
  x: number;
  y: number;
}

export interface PeerPresence {
  clientId: string;
  socketId: string;
  userName: string;
  color: string;
  cursor?: CursorPosition;
  selectedObjectId?: string;
  lastActive: number;
}

export interface PresenceUpdatePayload {
  clientId: string;
  userName?: string;
  color?: string;
  cursor?: CursorPosition;
  selectedObjectId?: string;
}

export interface PresenceStatePayload {
  peers: PeerPresence[];
}
