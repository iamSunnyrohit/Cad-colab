import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDb } from "./config/db";
import { documentsRouter } from "./routes/documents";
import { registerConnectionHandlers } from "./sockets/connection";

async function main() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/documents", documentsRouter);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }
  });
  registerConnectionHandlers(io);

  await connectDb();

  const port = Number(process.env.PORT) || 4000;
  httpServer.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal startup error", err);
  process.exit(1);
});
