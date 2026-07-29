import express from "express";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import authRoutes from "./routes/auth";
import complaintRoutes from "./routes/complaints";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/users";
import locationRoutes from "./routes/locations";
import sarpanchRoutes from "./routes/sarpanch";
import { errorHandler } from "./middleware/errorHandler";
import { env } from "./config/env";

const app = express();

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

startServer();
