import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { env } from "./env";
import * as schema from "../database/schema";

const client = new Client({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(client, { schema });

export async function initializeDatabase() {
  try {
    await client.connect();
    console.log("✅ Database connected");
    return db;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}
