import bcrypt from "bcryptjs";
import { db } from "../config/database";
import { districts, mandals, gramPanchayats, users, complaints, complaintTimeline } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("🌱 Starting comprehensive database seed...");

    // 1. Seed State & Districts
    let distRows = await db.select().from(districts).where(eq(districts.name, "Sangareddy"));
    let districtId: number;
    if (distRows.length > 0) {
      districtId = distRows[0].id;
    } else {
      const [inserted] = await db.insert(districts).values({ name: "Sangareddy", state: "Telangana" }).returning();
      districtId = inserted.id;
    }

    await db.insert(districts).values({ name: "Rangareddy", state: "Telangana" }).onConflictDoNothing();
    console.log("✅ Districts seeded (Sangareddy ID:", districtId, ")");

    // 2. Seed Mandals
    let mandRows = await db.select().from(mandals).where(eq(mandals.name, "Jharasangam"));
    let mandalId: number;
    if (mandRows.length > 0) {
      mandalId = mandRows[0].id;
    } else {
      const [inserted] = await db.insert(mandals).values({ name: "Jharasangam", districtId }).returning();
      mandalId = inserted.id;
    }

    await db.insert(mandals).values({ name: "Zaheerabad", districtId }).onConflictDoNothing();
    console.log("✅ Mandals seeded (Jharasangam ID:", mandalId, ")");

    // 3. Seed Gram Panchayats
    let gpRows = await db.select().from(gramPanchayats).where(eq(gramPanchayats.name, "Machnoor"));
    let machnoorId: number;
    if (gpRows.length > 0) {
      machnoorId = gpRows[0].id;
    } else {
      const [inserted] = await db.insert(gramPanchayats).values({ name: "Machnoor", mandalId, districtId }).returning();
      machnoorId = inserted.id;
    }

    await db.insert(gramPanchayats).values({ name: "Bardipur", mandalId, districtId }).onConflictDoNothing();
    console.log("✅ Gram Panchayats seeded (Machnoor ID:", machnoorId, ")");

    // 4. Seed Admin User (9999999999 / 0000)
    const adminPinHash = bcrypt.hashSync("0000", 10);
    const existingAdmin = await db.select().from(users).where(eq(users.phone, "9999999999"));
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        fullName: "District Collector / Admin",
        fathersName: "Govt of India",
        mothersName: "Telangana State",
        phone: "9999999999",
        pinHash: adminPinHash,
        role: "ADMIN",
        gramPanchayatId: machnoorId,
        isActive: true,
      });
    }
    console.log("✅ Admin user seeded (Phone: 9999999999, PIN: 0000)");

    // 5. Seed Sachiv / Sarpanch User (9876543210 / 1234)
    const sarpanchPinHash = bcrypt.hashSync("1234", 10);
    let sarpanchId: number;
    const existingSarpanch = await db.select().from(users).where(eq(users.phone, "9876543210"));
    if (existingSarpanch.length > 0) {
      sarpanchId = existingSarpanch[0].id;
    } else {
      const [inserted] = await db.insert(users).values({
        fullName: "K. Narsaiah (Sachiv)",
        fathersName: "K. Mallaiah",
        mothersName: "K. Laxmi",
        phone: "9876543210",
        pinHash: sarpanchPinHash,
        role: "SARPANCH",
        gramPanchayatId: machnoorId,
        isActive: true,
      }).returning();
      sarpanchId = inserted.id;
    }
    console.log("✅ Sarpanch user seeded (Phone: 9876543210, PIN: 1234)");

    // 6. Seed Test Villager User (9812345678 / 1234)
    const villagerPinHash = bcrypt.hashSync("1234", 10);
    let villagerId: number;
    const existingVillager = await db.select().from(users).where(eq(users.phone, "9812345678"));
    if (existingVillager.length > 0) {
      villagerId = existingVillager[0].id;
    } else {
      const [inserted] = await db.insert(users).values({
        fullName: "B. Balaji",
        fathersName: "B. Ramesh",
        mothersName: "B. Lakshmi",
        phone: "9812345678",
        pinHash: villagerPinHash,
        role: "VILLAGER",
        gramPanchayatId: machnoorId,
        isActive: true,
      }).returning();
      villagerId = inserted.id;
    }
    console.log("✅ Villager user seeded (Phone: 9812345678, PIN: 1234)");

    console.log("🌿 Comprehensive database seeding finished cleanly!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();
