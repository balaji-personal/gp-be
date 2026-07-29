import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { users } from "../database/schema";
import { env } from "../config/env";
import { AuthResponse, JWTPayload, LoginRequest, RegisterRequest, UserRole } from "../types";

function buildToken(payload: JWTPayload) {
  return jwt.sign(payload as object, String(env.JWT_SECRET), { expiresIn: String(env.JWT_EXPIRY) as jwt.SignOptions["expiresIn"] });
}

function mapUser(user: any) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    gramPanchayatId: user.gramPanchayatId,
  };
}

export async function register(req: Request, res: Response) {
  try {
    const body = req.body as RegisterRequest;
    const existing = await db.select().from(users).where(eq(users.phone, body.phone));
    if (existing.length) {
      return res.status(400).json({ success: false, error: "Phone number already exists" });
    }

    const pinHash = bcrypt.hashSync(body.pin, 10);
    const [user] = await db
      .insert(users)
      .values({
        fullName: body.fullName,
        fathersName: body.fathersName,
        mothersName: body.mothersName,
        phone: body.phone,
        pinHash,
        role: "VILLAGER",
        gramPanchayatId: body.gramPanchayatId,
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
      user: mapUser(user),
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = req.body as LoginRequest;
    const [user] = await db.select().from(users).where(eq(users.phone, body.phone));
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    const valid = bcrypt.compareSync(body.pin, user.pinHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
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
      user: mapUser(user),
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
}
