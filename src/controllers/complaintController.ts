import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { complaints } from "../database/schema";
import { AuthRequest } from "../middleware/auth";
import { ComplaintCategory, ComplaintResponse, ComplaintStatus } from "../types";
import { uploadMedia } from "../services/cloudinaryService";

function generateComplaintId(userId: number) {
  return `CMP-${Date.now()}-${userId}`;
}

export async function registerComplaint(req: AuthRequest, res: Response) {
  try {
    const { category, description } = req.body;
    const user = req.user!;

    if (!category || !description) {
      return res.status(400).json({ success: false, error: "Category and description are required" });
    }

    const complaintId = generateComplaintId(user.id);
    const files = req.files as { images?: Express.Multer.File[]; voice?: Express.Multer.File[] };

    const imageFiles = files?.images || [];
    const voiceFiles = files?.voice || [];
    const imageUrls: string[] = [];
    let voiceUrl: string | undefined;

    for (const file of imageFiles) {
      const url = await uploadMedia(file.buffer, `complaints/${complaintId}/images/${file.originalname}-${Date.now()}`);
      imageUrls.push(url);
    }

    if (voiceFiles.length > 0) {
      voiceUrl = await uploadMedia(voiceFiles[0].buffer, `complaints/${complaintId}/voice/${voiceFiles[0].originalname}-${Date.now()}`);
    }

    const [record] = await db
      .insert(complaints)
      .values({
        complaintId,
        villagerId: user.id,
        category,
        description,
        voiceUrl,
        imageUrls,
        status: "SUBMITTED",
      })
      .returning();

    const response: ComplaintResponse = {
      id: record.id,
      complaintId: record.complaintId,
      category: record.category as ComplaintCategory,
      description: record.description,
      status: (record.status || "SUBMITTED") as ComplaintStatus,
      voiceUrl: record.voiceUrl || undefined,
      imageUrls: record.imageUrls as string[],
      createdAt: record.createdAt ?? new Date(),
      updatedAt: record.updatedAt ?? new Date(),
    };

    return res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not register complaint" });
  }
}

export async function getMyComplaints(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    res.set("Cache-Control", "no-store");
    const records = await db.select().from(complaints).where(eq(complaints.villagerId, user.id));
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load complaints" });
  }
}

export async function getComplaintDetails(req: AuthRequest, res: Response) {
  try {
    const { complaintId } = req.params;
    const [record] = await db.select().from(complaints).where(eq(complaints.complaintId, complaintId));
    if (!record) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }
    return res.json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load complaint" });
  }
}
