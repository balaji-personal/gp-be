import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env.js";
import * as schema from "../database/schema.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection pool established");
    client.release();
    return db;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}
