import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { complaintTimeline, complaints, users } from "../database/schema.js";
import { AuthRequest } from "../middleware/auth.js";
import { ComplaintStatus, UserRole } from "../types/index.js";

function isValidComplaintStatus(status: string): status is ComplaintStatus {
  return ["SUBMITTED", "UNDER_PROCESS", "RESOLVED", "CLOSED"].includes(status);
}

export async function addVillager(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "SARPANCH") {
      return res.status(403).json({ success: false, error: "Only sarpanch can add villagers" });
    }

    const { fullName, fathersName, mothersName, phone, pin } = req.body;

    if (!fullName || !phone || !pin) {
      return res.status(400).json({ success: false, error: "Full name, phone and pin are required" });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, error: "PIN must be 4 digits" });
    }

    const existing = await db.select().from(users).where(eq(users.phone, phone));
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: "Phone number already registered" });
    }

    const pinHash = bcrypt.hashSync(pin, 10);
    const [user] = await db
      .insert(users)
      .values({
        fullName,
        fathersName: fathersName || "",
        mothersName: mothersName || "",
        phone,
        pinHash,
        role: "VILLAGER" as UserRole,
        gramPanchayatId: req.user.gramPanchayatId,
        isActive: true,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Villager added successfully",
      data: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not add villager" });
  }
}

export async function getVillageComplaints(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "SARPANCH") {
      return res.status(403).json({ success: false, error: "Only sarpanch can view village complaints" });
    }

    const villageId = req.user.gramPanchayatId;
    if (!villageId) {
      return res.status(400).json({ success: false, error: "Sarpanch is not assigned to a gram panchayat" });
    }

    const rows = await db
      .select({
        id: complaints.id,
        complaintId: complaints.complaintId,
        category: complaints.category,
        description: complaints.description,
        status: complaints.status,
        priority: complaints.priority,
        officialRemarks: complaints.officialRemarks,
        voiceUrl: complaints.voiceUrl,
        imageUrls: complaints.imageUrls,
        villagerName: users.fullName,
        villagerPhone: users.phone,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .innerJoin(users, eq(complaints.villagerId, users.id))
      .where(eq(users.gramPanchayatId, villageId));

    return res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load village complaints" });
  }
}

export async function updateComplaintStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "SARPANCH") {
      return res.status(403).json({ success: false, error: "Only sarpanch can update complaint status" });
    }

    const { complaintId } = req.params;
    const { newStatus, remarks } = req.body;

    if (!newStatus || !isValidComplaintStatus(newStatus)) {
      return res.status(400).json({ success: false, error: "Valid complaint status is required" });
    }

    const parsedComplaintId = Number(complaintId);
    if (!Number.isInteger(parsedComplaintId)) {
      return res.status(400).json({ success: false, error: "Invalid complaint id" });
    }

    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, parsedComplaintId));
    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    const [villager] = await db
      .select({ gramPanchayatId: users.gramPanchayatId })
      .from(users)
      .where(eq(users.id, complaint.villagerId));

    if (!villager || villager.gramPanchayatId !== req.user.gramPanchayatId) {
      return res.status(403).json({ success: false, error: "This complaint is not in your village" });
    }

    await db
      .update(complaints)
      .set({
        status: newStatus,
        sarpanchId: req.user.id,
        officialRemarks: remarks || complaint.officialRemarks,
        updatedAt: new Date(),
        resolvedAt: newStatus === "RESOLVED" || newStatus === "CLOSED" ? new Date() : null,
      })
      .where(eq(complaints.id, parsedComplaintId));

    await db.insert(complaintTimeline).values({
      complaintId: parsedComplaintId,
      previousStatus: complaint.status,
      newStatus,
      remarks: remarks || "",
      updatedBy: req.user.id,
    });

    return res.json({ success: true, message: "Complaint status updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not update complaint status" });
  }
}
