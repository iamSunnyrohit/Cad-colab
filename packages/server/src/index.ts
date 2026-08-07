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
  const allowedOrigins = [process.env.CLIENT_ORIGIN || "http://localhost:5173", "http://127.0.0.1:5173"];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/documents", documentsRouter);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true }
  });
  registerConnectionHandlers(io);

  await connectDb();

  const port = Number(process.env.PORT) || 4000;
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`[server] listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal startup error", err);
  process.exit(1);
});
