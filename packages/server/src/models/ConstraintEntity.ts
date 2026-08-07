import { Schema, model } from "mongoose";

const ConstraintSchema = new Schema(
  {
    docId: { type: String, required: true, index: true },
    kind: { type: String, required: true },
    refs: { type: [String], required: true },
    params: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const ConstraintEntity = model("ConstraintEntity", ConstraintSchema);
