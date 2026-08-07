import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserModel } from "../models/User";
import { UserProfile } from "@cad-collab/shared";

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "cad-collab-secret-key-2026";

function generateToken(user: any): string {
  return jwt.sign({ id: user._id, email: user.email, username: user.username }, JWT_SECRET, {
    expiresIn: "7d"
  });
}

function formatUserProfile(user: any): UserProfile {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    color: user.color || "#2563eb",
    createdAt: user.createdAt
  };
}

// Register a new user account
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as { username?: string; email?: string; password?: string };

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const user = await UserModel.create({
      _id: userId,
      username,
      email: email.toLowerCase(),
      passwordHash
    });

    const token = generateToken(user);
    res.status(201).json({ user: formatUserProfile(user), token });
  } catch (err: any) {
    console.error("[auth] Register error:", err);
    res.status(500).json({ error: err.message || "Failed to register user" });
  }
});

// Login with email and password
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.json({ user: formatUserProfile(user), token });
  } catch (err: any) {
    console.error("[auth] Login error:", err);
    res.status(500).json({ error: err.message || "Failed to log in" });
  }
});

// Fetch authenticated user profile
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: formatUserProfile(user) });
  } catch (err: any) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});
