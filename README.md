# CAD Collab — Phase 0 Skeleton

Real-time collaborative CAD viewer. This is the **Phase 0 walking skeleton**:

- Single-user vector editor (draw/move lines, circles, rectangles) on an HTML canvas via `react-konva`
- Objects persisted to MongoDB as static JSON (no OT yet — that's Phase 1)
- REST API to save/load a document's objects
- Socket.IO wired up but only used for connection/room join in this phase

## Goal of Phase 0

Verify the canvas rendering and the database round-trip work end to end, before
any operational-transform complexity is introduced.

## Running locally

```bash
# 1. start mongo (and redis, for later phases)
docker compose up -d

# 2. install deps (workspaces)
npm install

# 3. build the shared package (types + OT stubs used by both client & server)
npm run build:shared

# 4. run server (http://localhost:4000)
npm run dev:server

# 5. run client (http://localhost:5173)
npm run dev:client
```

## Package layout

- `packages/shared` — types + OT transform functions (stubs in Phase 0, filled in Phase 1)
- `packages/server` — Express + Socket.IO + Mongoose
- `packages/client` — React + Vite + react-konva

## Roadmap

- [x] Phase 0 — walking skeleton (this scaffold)
- [x] Phase 1 — OT for positional (move) ops
- [x] Phase 2 — constraint integration
- [ ] Phase 3 — network resilience & presence
- [ ] Phase 4 — optimization & polish
