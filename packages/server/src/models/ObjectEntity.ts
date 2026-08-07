import { Schema, model } from "mongoose";

// Phase 0: objects stored as flexible JSON matching the shared GeometryObject union.
// Indexes here mirror what the design doc calls for once Phase 4 spatial queries land.
const ObjectSchema = new Schema(
  {
    docId: { type: String, required: true, index: true },
    type: { type: String, enum: ["line", "circle", "rectangle"], required: true },
    version: { type: Number, default: 0 },
    props: { type: Schema.Types.Mixed, required: true } // points / center+radius / topLeft+w+h
  },
  { timestamps: true }
);

ObjectSchema.index({ docId: 1, type: 1 });

export const ObjectEntity = model("ObjectEntity", ObjectSchema);
