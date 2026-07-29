import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { districts, mandals, gramPanchayats } from "../database/schema";

export async function getDistricts(_req: Request, res: Response) {
  try {
    const records = await db.select().from(districts);
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load districts" });
  }
}

export async function getMandals(req: Request, res: Response) {
  try {
    const districtId = Number(req.query.districtId);
    if (!districtId) {
      return res.status(400).json({ success: false, error: "districtId is required" });
    }

    const records = await db.select().from(mandals).where(eq(mandals.districtId, districtId));
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load mandals" });
  }
}

export async function getGramPanchayats(req: Request, res: Response) {
  try {
    const mandalId = Number(req.query.mandalId);
    if (!mandalId) {
      return res.status(400).json({ success: false, error: "mandalId is required" });
    }

    const records = await db
      .select()
      .from(gramPanchayats)
      .where(eq(gramPanchayats.mandalId, mandalId));
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load gram panchayats" });
  }
}
