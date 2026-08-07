import { Schema, model } from "mongoose";

// Phase 1+: append-only op log, the source of truth for OT.
// TTL index retains only the last 24h (recovery window); full state lives in ObjectEntity snapshots.
const OperationSchema = new Schema({
  opId: { type: String, required: true, unique: true },
  docId: { type: String, required: true, index: true },
  clientId: { type: String, required: true },
  type: { type: String, required: true },
  args: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Number, required: true },
  seq: { type: Number, required: true },
  refSeq: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }
});

OperationSchema.index({ docId: 1, timestamp: 1 });

export const OperationModel = model("Operation", OperationSchema);
