import express from "express";
import cors from "cors";
import { initializeDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import complaintRoutes from "./routes/complaints.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import locationRoutes from "./routes/locations.js";
import sarpanchRoutes from "./routes/sarpanch.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();
app.get("/", (_req, res) => res.json({ success: true, message: "Gram Panchayat API is running" }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/sarpanch", sarpanchRoutes);

app.use(errorHandler);

async function startServer() {
  await initializeDatabase();
  app.listen(Number(env.PORT), () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
