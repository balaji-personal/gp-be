import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { users, gramPanchayats, districts, mandals } from "../database/schema.js";
import { env } from "../config/env.js";
import { AuthResponse, JWTPayload, LoginRequest, RegisterRequest, UserProfile, UserRole } from "../types/index.js";

function buildToken(payload: JWTPayload) {
  return jwt.sign(payload as object, String(env.JWT_SECRET || 'secret'), { expiresIn: '7d' });
}

async function mapUser(user: typeof users.$inferSelect): Promise<UserProfile> {
  const [location] = await db
    .select({
      gramPanchayatName: gramPanchayats.name,
      mandalId: mandals.id,
      mandalName: mandals.name,
      districtId: districts.id,
      districtName: districts.name,
      stateName: districts.state,
    })
    .from(gramPanchayats)
    .leftJoin(mandals, eq(gramPanchayats.mandalId, mandals.id))
    .leftJoin(districts, eq(gramPanchayats.districtId, districts.id))
    .where(eq(gramPanchayats.id, user.gramPanchayatId!));

  return {
    id: user.id,
    fullName: user.fullName,
    fathersName: user.fathersName,
    mothersName: user.mothersName,
    phone: user.phone,
    role: user.role as UserRole,
    isActive: user.isActive,
    gramPanchayatId: user.gramPanchayatId,
    gramPanchayatName: location?.gramPanchayatName ?? null,
    mandalId: location?.mandalId ?? null,
    mandalName: location?.mandalName ?? null,
    districtId: location?.districtId ?? null,
    districtName: location?.districtName ?? null,
    stateName: location?.stateName ?? null,
    createdAt: user.createdAt,
  };
}

// Ensure at least 1 Gram Panchayat exists in DB and return its ID
async function getOrCreateDefaultGPId(): Promise<number> {
  try {
    const list = await db.select().from(gramPanchayats);
    if (list.length > 0) return list[0].id;

    // Create district & mandal first if needed
    let distId = 1;
    const distList = await db.select().from(districts);
    if (distList.length > 0) {
      distId = distList[0].id;
    } else {
      const [d] = await db.insert(districts).values({ name: "Sangareddy", state: "Telangana" }).returning();
      distId = d.id;
    }

    let mandId = 1;
    const mandList = await db.select().from(mandals);
    if (mandList.length > 0) {
      mandId = mandList[0].id;
    } else {
      const [m] = await db.insert(mandals).values({ name: "Jharasangam", districtId: distId }).returning();
      mandId = m.id;
    }

    const [gp] = await db.insert(gramPanchayats).values({ name: "Machnoor", mandalId: mandId, districtId: distId }).returning();
    return gp.id;
  } catch (e) {
    console.warn("Fallback default GP ID:", e);
    return 1;
  }
}

export async function register(req: Request, res: Response) {
  try {
    const body = req.body as RegisterRequest;
    if (!body.phone || !body.pin || !body.fullName) {
      return res.status(400).json({ success: false, error: "FullName, Phone, and PIN are required" });
    }

    const existing = await db.select().from(users).where(eq(users.phone, body.phone));
    if (existing.length) {
      return res.status(400).json({ success: false, error: "Phone number already registered" });
    }

    // Ensure valid gramPanchayatId
    let gpId = Number(body.gramPanchayatId);
    if (!gpId) {
      gpId = await getOrCreateDefaultGPId();
    } else {
      const validGp = await db.select().from(gramPanchayats).where(eq(gramPanchayats.id, gpId));
      if (validGp.length === 0) {
        gpId = await getOrCreateDefaultGPId();
      }
    }

    const pinHash = bcrypt.hashSync(body.pin, 10);
    const [user] = await db
      .insert(users)
      .values({
        fullName: body.fullName,
        fathersName: body.fathersName || "N/A",
        mothersName: body.mothersName || "N/A",
        phone: body.phone,
        pinHash,
        role: "VILLAGER",
        gramPanchayatId: gpId,
        isActive: true,
      })
      .returning();

    const token = buildToken({
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      gramPanchayatId: user.gramPanchayatId,
    });

    const response: AuthResponse = {
      success: true,
      message: "Registration successful",
      token,
      user: await mapUser(user),
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = req.body as LoginRequest;
    if (!body.phone || !body.pin) {
      return res.status(400).json({ success: false, error: "Phone and PIN are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.phone, body.phone));

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid credentials. Mobile number not registered." });
    }

    const valid = bcrypt.compareSync(body.pin, user.pinHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: "Invalid PIN. Please try again." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Account is inactive" });
    }

    const token = buildToken({
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      gramPanchayatId: user.gramPanchayatId,
    });

    const response: AuthResponse = {
      success: true,
      message: "Login successful",
      token,
      user: await mapUser(user),
    };

    return res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
}
