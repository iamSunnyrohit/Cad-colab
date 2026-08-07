import { Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { Op, MoveOp } from "@cad-collab/shared";

export class OpSender {
  private socket: Socket;
  private docId: string;
  private clientId: string;
  private getRefSeq: () => number;
  private applyLocalOp: (op: Op) => void;

  private activeObjectId: string | null = null;
  private activePointIndex?: number;
  private accumulatedDx = 0;
  private accumulatedDy = 0;
  private lastSentTime = 0;
  private sendTimeout: any = null;

  constructor(
    socket: Socket,
    docId: string,
    clientId: string,
    getRefSeq: () => number,
    applyLocalOp: (op: Op) => void
  ) {
    this.socket = socket;
    this.docId = docId;
    this.clientId = clientId;
    this.getRefSeq = getRefSeq;
    this.applyLocalOp = applyLocalOp;
  }

  public registerDragStart(objectId: string, pointIndex?: number) {
    this.activeObjectId = objectId;
    this.activePointIndex = pointIndex;
    this.accumulatedDx = 0;
    this.accumulatedDy = 0;
    this.lastSentTime = Date.now();
  }

  public registerDragMove(dx: number, dy: number) {
    if (!this.activeObjectId) return;
    this.accumulatedDx += dx;
    this.accumulatedDy += dy;

    const now = Date.now();
    const elapsed = now - this.lastSentTime;

    if (elapsed >= 16) {
      this.flush();
    } else if (!this.sendTimeout) {
      this.sendTimeout = setTimeout(() => {
        this.flush();
      }, 16 - elapsed);
    }
  }

  public registerDragEnd(dx: number, dy: number) {
    if (!this.activeObjectId) return;
    this.accumulatedDx += dx;
    this.accumulatedDy += dy;
    this.flush();
    this.activeObjectId = null;
    this.activePointIndex = undefined;
  }

  private flush() {
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }

    if (!this.activeObjectId) return;
    if (this.accumulatedDx === 0 && this.accumulatedDy === 0) return;

    const op: MoveOp = {
      opId: uuidv4(),
      docId: this.docId,
      clientId: this.clientId,
      timestamp: Date.now(),
      refSeq: this.getRefSeq(),
      type: "move",
      objectId: this.activeObjectId,
      delta: { dx: this.accumulatedDx, dy: this.accumulatedDy },
      pointIndex: this.activePointIndex
    };

    // Reset accumulators before calling callbacks to prevent double flushes
    this.accumulatedDx = 0;
    this.accumulatedDy = 0;
    this.lastSentTime = Date.now();

    // Apply prediction locally
    this.applyLocalOp(op);

    // Send to server
    this.socket.emit("submit-op", op);
  }
}
