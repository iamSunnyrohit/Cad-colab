import mongoose from "mongoose";

export async function connectDb(): Promise<void> {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/cad_collab";
  await mongoose.connect(uri);
  console.log(`[db] connected to ${uri}`);
}
