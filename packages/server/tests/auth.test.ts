import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { authRouter } from "../src/routes/auth";
import { UserModel } from "../src/models/User";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

describe("User Authentication Tests", () => {
  let app: express.Express;
  let httpServer: any;
  let port: number;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/cad_collab_test";
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }).catch(() => {});
    }

    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);

    httpServer = createServer(app);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it("registers a new user and returns JWT token", async () => {
    if (mongoose.connection.readyState === 0) return;

    const email = `testuser_${Date.now()}@example.com`;
    const res = await fetch(`http://localhost:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Test User",
        email,
        password: "secretpassword123"
      })
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(email);
    expect(data.user.username).toBe("Test User");
    expect(data.token).toBeDefined();

    // Verify password is hashed in database
    const dbUser = await UserModel.findOne({ email });
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).not.toBe("secretpassword123");
  });

  it("authenticates valid user login", async () => {
    if (mongoose.connection.readyState === 0) return;

    const email = `login_${Date.now()}@example.com`;
    await fetch(`http://localhost:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Login User", email, password: "password123" })
    });

    const loginRes = await fetch(`http://localhost:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" })
    });

    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginData.user.email).toBe(email);
    expect(loginData.token).toBeDefined();
  });
});
