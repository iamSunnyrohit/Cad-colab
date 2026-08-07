import { Schema, model } from "mongoose";

const DocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    version: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const DocumentModel = model("Document", DocumentSchema);
