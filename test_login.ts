import { db } from "./src/config/database";
import { users } from "./src/database/schema";

async function test() {
  try {
    console.log("Testing database query users...");
    const res = await db.select().from(users);
    console.log("Users count:", res.length, res);
  } catch (err) {
    console.error("Database query error:", err);
  } finally {
    process.exit(0);
  }
}

test();
