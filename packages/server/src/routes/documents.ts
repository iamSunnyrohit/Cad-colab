import { Router } from "express";
import { DocumentModel } from "../models/Document";
import { ObjectEntity } from "../models/ObjectEntity";
import { ConstraintEntity } from "../models/ConstraintEntity";
import { OperationModel } from "../models/Operation";

export const documentsRouter = Router();

// Create a new document
documentsRouter.post("/", async (req, res) => {
  const { name } = req.body as { name?: string };
  const doc = await DocumentModel.create({ name: name || "Untitled" });
  res.status(201).json(doc);
});

// Load a document's objects, constraints, and version
documentsRouter.get("/:docId/objects", async (req, res) => {
  const objects = await ObjectEntity.find({ docId: req.params.docId }).lean();
  const constraints = await ConstraintEntity.find({ docId: req.params.docId }).lean();
  const doc = await DocumentModel.findById(req.params.docId);
  res.json({
    objects,
    constraints,
    version: doc?.version || 0
  });
});

// Catch-up endpoint: fetch operations with seq > sinceSeq for network reconnection sync
documentsRouter.get("/:docId/ops", async (req, res) => {
  const sinceSeq = parseInt((req.query.sinceSeq as string) || "0", 10);
  const ops = await OperationModel.find({
    docId: req.params.docId,
    seq: { $gt: sinceSeq }
  }).sort({ seq: 1 }).lean();

  const formattedOps = ops.map(c => ({
    opId: c.opId,
    docId: c.docId,
    clientId: c.clientId,
    type: c.type,
    timestamp: c.timestamp,
    seq: c.seq,
    refSeq: c.refSeq,
    ...(c.args || {})
  }));

  res.json({ ops: formattedOps });
});

// Save/create an object (Phase 0 stand-in for real op application)
documentsRouter.post("/:docId/objects", async (req, res) => {
  const { id, _id, type, props } = req.body as { id?: string; _id?: string; type: string; props: unknown };
  const obj = await ObjectEntity.create({
    _id: id || _id || crypto.randomUUID(),
    docId: req.params.docId,
    type,
    props,
    version: 0
  });
  res.status(201).json(obj);
});

documentsRouter.patch("/:docId/objects/:objectId", async (req, res) => {
  const { props } = req.body as { props: unknown };
  const updated = await ObjectEntity.findByIdAndUpdate(
    req.params.objectId,
    { $set: { props }, $inc: { version: 1 } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

documentsRouter.delete("/:docId/objects/:objectId", async (req, res) => {
  await ObjectEntity.findByIdAndDelete(req.params.objectId);
  res.status(204).send();
});
