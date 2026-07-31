import { Request, Response } from "express";
import { db } from "../config/database.js";
import { users } from "../database/schema.js";

export async function getUsers(req: Request, res: Response) {
  try {
    const records = await db.select().from(users);
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load users" });
  }
}
