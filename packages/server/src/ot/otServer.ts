import { Op, solveConstraints } from "@cad-collab/shared";
import { transform } from "@cad-collab/shared";
import { OperationModel } from "../models/Operation";
import { DocumentModel } from "../models/Document";
import { ObjectEntity } from "../models/ObjectEntity";
import { ConstraintEntity } from "../models/ConstraintEntity";
import { validateConstraint } from "../services/constraintValidator";

class DocumentQueue {
  private queues: Map<string, Promise<any>> = new Map();

  public async enqueue<T>(docId: string, task: () => Promise<T>): Promise<T> {
    const current = this.queues.get(docId) || Promise.resolve();
    const next = current.then(task);
    this.queues.set(docId, next);

    next.finally(() => {
      if (this.queues.get(docId) === next) {
        this.queues.delete(docId);
      }
    });

    return next;
  }
}

export const documentQueue = new DocumentQueue();

// Apply move op to object properties (primary shift before constraint propagation)
function applyMoveOpToProps(type: string, props: any, op: any): any {
  const newProps = { ...props };
  if (type === "circle" || type === "rectangle") {
    newProps.x = (Number(newProps.x) || 0) + op.delta.dx;
    newProps.y = (Number(newProps.y) || 0) + op.delta.dy;
  } else if (type === "line") {
    const points = [...(newProps.points || [])];
    if (op.pointIndex !== undefined) {
      points[op.pointIndex * 2] += op.delta.dx;
      points[op.pointIndex * 2 + 1] += op.delta.dy;
    } else {
      for (let i = 0; i < points.length; i += 2) {
        points[i] += op.delta.dx;
        points[i + 1] += op.delta.dy;
      }
    }
    newProps.points = points;
  }
  return newProps;
}

export async function processIncomingOp(op: Op): Promise<Op> {
  // 1. Get a new sequence number atomically from the document
  const doc = await DocumentModel.findByIdAndUpdate(
    op.docId,
    { $inc: { version: 1 } },
    { new: true }
  );
  if (!doc) {
    throw new Error(`Document ${op.docId} not found`);
  }
  const assignedSeq = doc.version;

  // 2. Fetch concurrent operations (those that happened after refSeq)
  const concurrentDocs = await OperationModel.find({
    docId: op.docId,
    seq: { $gt: op.refSeq }
  }).sort({ seq: 1 });

  const concurrentOps: Op[] = concurrentDocs.map(c => {
    const reconstructed: any = {
      opId: c.opId,
      docId: c.docId,
      clientId: c.clientId,
      type: c.type as any,
      timestamp: c.timestamp,
      seq: c.seq,
      refSeq: c.refSeq
    };
    if (c.args) {
      Object.assign(reconstructed, c.args);
    }
    return reconstructed as Op;
  });

  // 3. Run incoming op through transform() against concurrent ops
  let transformedOp = { ...op };
  for (const cop of concurrentOps) {
    const [first, second] = transform(transformedOp, cop);
    if (first.opId === cop.opId) {
      transformedOp = second;
    } else {
      transformedOp = first;
    }
  }

  // Set the authoritative sequence number
  transformedOp.seq = assignedSeq;

  // 4. Validate and apply to database state (ObjectEntity / ConstraintEntity snapshot)
  if (transformedOp.type === "create") {
    await ObjectEntity.create({
      _id: transformedOp.object.id,
      docId: transformedOp.docId,
      type: transformedOp.object.type,
      version: assignedSeq,
      props: transformedOp.object.props
    });
  } else if (transformedOp.type === "move") {
    // A. Apply primary translation
    const obj = await ObjectEntity.findById(transformedOp.objectId);
    if (obj) {
      obj.props = applyMoveOpToProps(obj.type, obj.props, transformedOp);
      obj.version = assignedSeq;
      await obj.save();
    }

    // B. Run solver to propagate updates through constraint graph
    const objects = await ObjectEntity.find({ docId: transformedOp.docId }).lean() as any[];
    const constraints = await ConstraintEntity.find({ docId: transformedOp.docId }).lean() as any[];

    const fixedPoints: Record<string, { x: number; y: number }> = {};
    const movedObj = objects.find(o => o._id === transformedOp.objectId);
    if (movedObj) {
      const oId = movedObj._id;
      if (movedObj.type === "circle") {
        fixedPoints[`${oId}:center`] = { x: movedObj.props.x, y: movedObj.props.y };
      } else if (movedObj.type === "rectangle") {
        fixedPoints[`${oId}:topLeft`] = { x: movedObj.props.x, y: movedObj.props.y };
      } else if (movedObj.type === "line") {
        if (transformedOp.pointIndex === 0) {
          fixedPoints[`${oId}:0`] = { x: movedObj.props.points[0], y: movedObj.props.points[1] };
        } else if (transformedOp.pointIndex === 1) {
          fixedPoints[`${oId}:1`] = { x: movedObj.props.points[2], y: movedObj.props.points[3] };
        } else {
          fixedPoints[`${oId}:0`] = { x: movedObj.props.points[0], y: movedObj.props.points[1] };
          fixedPoints[`${oId}:1`] = { x: movedObj.props.points[2], y: movedObj.props.points[3] };
        }
      }
    }

    // Map DB objects to solver inputs (renaming DB _id key to id)
    const solverInputs = objects.map(o => ({
      id: o._id,
      docId: o.docId,
      type: o.type,
      version: o.version,
      props: o.props
    }));
    const solverConstraints = constraints.map(c => ({
      id: c._id,
      kind: c.kind,
      refs: c.refs,
      params: c.params
    }));

    const solved = solveConstraints(solverInputs as any, solverConstraints, fixedPoints);

    // Save solved state back to DB
    for (const sObj of solved) {
      await ObjectEntity.findByIdAndUpdate(sObj.id, {
        $set: { props: sObj.props },
        $inc: { version: 1 }
      });
    }
  } else if (transformedOp.type === "delete") {
    // Delete object
    await ObjectEntity.findByIdAndDelete(transformedOp.objectId);
    // Cascade delete any constraints referencing this object
    await ConstraintEntity.deleteMany({
      docId: transformedOp.docId,
      refs: { $regex: new RegExp(`^${transformedOp.objectId}(:|$)`) }
    });
  } else if (transformedOp.type === "addConstraint") {
    const objects = await ObjectEntity.find({ docId: transformedOp.docId }).lean() as any[];
    const constraints = await ConstraintEntity.find({ docId: transformedOp.docId }).lean() as any[];

    const solverInputs = objects.map(o => ({
      id: o._id,
      docId: o.docId,
      type: o.type,
      version: o.version,
      props: o.props
    }));
    const solverConstraints = constraints.map(c => ({
      id: c._id,
      kind: c.kind,
      refs: c.refs,
      params: c.params
    }));

    // Validate satisfiability
    const isValid = validateConstraint(
      solverInputs as any,
      solverConstraints,
      transformedOp.constraint
    );

    if (!isValid) {
      throw new Error(`Contradictory/unsatisfiable constraint`);
    }

    // Create constraint in DB
    await ConstraintEntity.create({
      _id: transformedOp.constraint.id,
      docId: transformedOp.docId,
      kind: transformedOp.constraint.kind,
      refs: transformedOp.constraint.refs,
      params: transformedOp.constraint.params
    });

    // Solve and snap objects to the new constraint
    const allConstraints = [...solverConstraints, transformedOp.constraint];
    const solved = solveConstraints(solverInputs as any, allConstraints, {});
    for (const sObj of solved) {
      await ObjectEntity.findByIdAndUpdate(sObj.id, {
        $set: { props: sObj.props },
        $inc: { version: 1 }
      });
    }
  } else if (transformedOp.type === "removeConstraint") {
    await ConstraintEntity.findByIdAndDelete(transformedOp.constraintId);
  }

  // 5. Append to the operation log
  const { opId, docId, clientId, type, timestamp, seq, refSeq, ...args } = transformedOp;
  await OperationModel.create({
    opId,
    docId,
    clientId,
    type,
    timestamp,
    seq: assignedSeq,
    refSeq,
    args
  });

  // 6. Periodic log compaction (prune ops older than 200 sequence steps every 50 ops)
  if (assignedSeq % 50 === 0 && assignedSeq > 200) {
    const pruneBeforeSeq = assignedSeq - 200;
    OperationModel.deleteMany({ docId, seq: { $lt: pruneBeforeSeq } }).catch(err => {
      console.warn(`[op-compaction] error pruning ops for ${docId}:`, err);
    });
  }

  return transformedOp;
}
