import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, count, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { users, complaints, gramPanchayats, mandals, districts, complaintTimeline } from "../database/schema.js";
import { UserRole } from "../types/index.js";
import { env } from "../config/env.js";

export async function adminLogin(req: Request, res: Response) {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ success: false, error: "Phone and PIN are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user || user.role !== "ADMIN") {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    const isValid = bcrypt.compareSync(pin, user.pinHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, gramPanchayatId: user.gramPanchayatId },
      String(env.JWT_SECRET),
      { expiresIn: "365d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Admin login failed" });
  }
}

export async function getAnalytics(_req: Request, res: Response) {
  try {
    const totalComplaintsRes = await db.select({ count: count() }).from(complaints);
    const totalComplaints = Number(totalComplaintsRes[0]?.count || 0);

    const submittedRes = await db.select({ count: count() }).from(complaints).where(eq(complaints.status, "SUBMITTED"));
    const underProcessRes = await db.select({ count: count() }).from(complaints).where(eq(complaints.status, "UNDER_PROCESS"));
    const resolvedRes = await db.select({ count: count() }).from(complaints).where(eq(complaints.status, "RESOLVED"));
    const closedRes = await db.select({ count: count() }).from(complaints).where(eq(complaints.status, "CLOSED"));

    const submitted = Number(submittedRes[0]?.count || 0);
    const underProcess = Number(underProcessRes[0]?.count || 0);
    const resolved = Number(resolvedRes[0]?.count || 0);
    const closed = Number(closedRes[0]?.count || 0);

    const totalSachivsRes = await db.select({ count: count() }).from(users).where(eq(users.role, "SARPANCH"));
    const totalSachivs = Number(totalSachivsRes[0]?.count || 0);

    const totalVillagersRes = await db.select({ count: count() }).from(users).where(eq(users.role, "VILLAGER"));
    const totalVillagers = Number(totalVillagersRes[0]?.count || 0);

    const totalVillagesRes = await db.select({ count: count() }).from(gramPanchayats);
    const totalVillages = Number(totalVillagesRes[0]?.count || 0);

    const timelineCountRes = await db.select({ count: count() }).from(complaintTimeline);
    const smsCount = Number(timelineCountRes[0]?.count || 0) + totalComplaints;
    const smsCost = (smsCount * 0.5).toFixed(2);

    const categoryBreakdown = await db
      .select({
        category: complaints.category,
        count: count(),
      })
      .from(complaints)
      .groupBy(complaints.category);

    const resolutionRate = totalComplaints > 0 ? Math.round(((resolved + closed) / totalComplaints) * 100) : 0;

    return res.json({
      success: true,
      data: {
        totalComplaints,
        submitted,
        underProcess,
        resolved,
        closed,
        totalSachivs,
        totalVillagers,
        totalVillages,
        resolutionRate,
        smsCount,
        smsCost: `₹${smsCost}`,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load analytics" });
  }
}

export async function getAllComplaints(req: Request, res: Response) {
  try {
    const { status, search } = req.query;

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
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
        villagerName: users.fullName,
        villagerPhone: users.phone,
        gramPanchayatName: gramPanchayats.name,
        mandalName: mandals.name,
        districtName: districts.name,
        stateName: districts.state,
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.villagerId, users.id))
      .leftJoin(gramPanchayats, eq(users.gramPanchayatId, gramPanchayats.id))
      .leftJoin(mandals, eq(gramPanchayats.mandalId, mandals.id))
      .leftJoin(districts, eq(gramPanchayats.districtId, districts.id));

    let filtered = rows;
    if (status && status !== "ALL") {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (search) {
      const query = String(search).toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.complaintId.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          (r.villagerName && r.villagerName.toLowerCase().includes(query)) ||
          (r.gramPanchayatName && r.gramPanchayatName.toLowerCase().includes(query))
      );
    }

    return res.json({ success: true, total: filtered.length, data: filtered });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load all complaints" });
  }
}

export async function getSachivs(_req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        gramPanchayatId: users.gramPanchayatId,
        gramPanchayatName: gramPanchayats.name,
        mandalName: mandals.name,
        districtName: districts.name,
      })
      .from(users)
      .leftJoin(gramPanchayats, eq(users.gramPanchayatId, gramPanchayats.id))
      .leftJoin(mandals, eq(gramPanchayats.mandalId, mandals.id))
      .leftJoin(districts, eq(gramPanchayats.districtId, districts.id))
      .where(eq(users.role, "SARPANCH"));

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load Sachivs" });
  }
}

export async function addSarpanch(req: Request, res: Response) {
  try {
    const { fullName, phone, pin, gramPanchayatId } = req.body;
    if (!fullName || !phone || !pin || !gramPanchayatId) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const existing = await db.select().from(users).where(eq(users.phone, phone));
    if (existing.length) {
      return res.status(400).json({ success: false, error: "Phone number already registered" });
    }

    const pinHash = bcrypt.hashSync(pin, 10);
    const [user] = await db
      .insert(users)
      .values({
        fullName,
        fathersName: "Government Official",
        mothersName: "State Panchayat",
        phone,
        pinHash,
        role: "SARPANCH" as UserRole,
        gramPanchayatId: Number(gramPanchayatId),
        isActive: true,
      })
      .returning();

    return res.status(201).json({ success: true, message: "Sachiv account created successfully", data: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not add Sachiv" });
  }
}

export async function changeUserStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    await db.update(users).set({ isActive }).where(eq(users.id, Number(userId)));
    return res.json({ success: true, message: "User status updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not update status" });
  }
}

export async function getVillages(_req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: gramPanchayats.id,
        name: gramPanchayats.name,
        mandalId: gramPanchayats.mandalId,
        mandalName: mandals.name,
        districtId: gramPanchayats.districtId,
        districtName: districts.name,
        stateName: districts.state,
      })
      .from(gramPanchayats)
      .leftJoin(mandals, eq(gramPanchayats.mandalId, mandals.id))
      .leftJoin(districts, eq(gramPanchayats.districtId, districts.id));

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not load villages" });
  }
}

export async function addVillage(req: Request, res: Response) {
  try {
    const { name, mandalId, districtId } = req.body;
    if (!name || !mandalId || !districtId) {
      return res.status(400).json({ success: false, error: "Village name, mandal, and district are required" });
    }

    const [gp] = await db
      .insert(gramPanchayats)
      .values({
        name,
        mandalId: Number(mandalId),
        districtId: Number(districtId),
      })
      .returning();

    return res.status(201).json({ success: true, message: "Gram Panchayat added successfully", data: gp });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Could not add village" });
  }
}
