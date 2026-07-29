import bcrypt from "bcryptjs";
import { db } from "../config/database";
import { districts, mandals, gramPanchayats, users, complaints, complaintTimeline } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("🌱 Starting comprehensive database seed...");

    // 1. Seed State & Districts
    const [dist1] = await db
      .insert(districts)
      .values({
        name: "Sangareddy",
        state: "Telangana",
      })
      .onConflictDoNothing()
      .returning();

    const [dist2] = await db
      .insert(districts)
      .values({
        name: "Rangareddy",
        state: "Telangana",
      })
      .onConflictDoNothing()
      .returning();

    const districtId = dist1 ? dist1.id : (await db.select().from(districts).where(eq(districts.name, "Sangareddy")))[0].id;
    const districtId2 = dist2 ? dist2.id : (await db.select().from(districts).where(eq(districts.name, "Rangareddy")))[0].id;

    console.log("✅ Districts seeded (Sangareddy, Rangareddy)");

    // 2. Seed Mandals
    const [mand1] = await db
      .insert(mandals)
      .values({
        name: "Jharasangam",
        districtId: districtId,
      })
      .onConflictDoNothing()
      .returning();

    const [mand2] = await db
      .insert(mandals)
      .values({
        name: "Zaheerabad",
        districtId: districtId,
      })
      .onConflictDoNothing()
      .returning();

    const mandalId = mand1 ? mand1.id : (await db.select().from(mandals).where(eq(mandals.name, "Jharasangam")))[0].id;

    console.log("✅ Mandals seeded (Jharasangam, Zaheerabad)");

    // 3. Seed Gram Panchayats
    const [gp1] = await db
      .insert(gramPanchayats)
      .values({
        name: "Machnoor",
        mandalId: mandalId,
        districtId: districtId,
      })
      .onConflictDoNothing()
      .returning();

    const [gp2] = await db
      .insert(gramPanchayats)
      .values({
        name: "Bardipur",
        mandalId: mandalId,
        districtId: districtId,
      })
      .onConflictDoNothing()
      .returning();

    const machnoorId = gp1 ? gp1.id : (await db.select().from(gramPanchayats).where(eq(gramPanchayats.name, "Machnoor")))[0].id;

    console.log("✅ Gram Panchayats seeded (Machnoor, Bardipur)");

    // 4. Seed Admin User
    const adminPinHash = bcrypt.hashSync("0000", 10);
    await db
      .insert(users)
      .values({
        fullName: "District Collector / Admin",
        fathersName: "Govt of India",
        mothersName: "Telangana State",
        phone: "9999999999",
        pinHash: adminPinHash,
        role: "ADMIN",
        gramPanchayatId: machnoorId,
        isActive: true,
      })
      .onConflictDoNothing();

    console.log("✅ Admin user seeded (Phone: 9999999999, PIN: 0000)");

    // 5. Seed Sachiv / Sarpanch User
    const sarpanchPinHash = bcrypt.hashSync("1234", 10);
    const [sarpanchUser] = await db
      .insert(users)
      .values({
        fullName: "K. Narsaiah (Sachiv)",
        fathersName: "K. Mallaiah",
        mothersName: "K. Laxmi",
        phone: "9876543210",
        pinHash: sarpanchPinHash,
        role: "SARPANCH",
        gramPanchayatId: machnoorId,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const sarpanchId = sarpanchUser
      ? sarpanchUser.id
      : (await db.select().from(users).where(eq(users.phone, "9876543210")))[0]?.id;

    console.log("✅ Sarpanch/Sachiv seeded (Phone: 9876543210, PIN: 1234)");

    // 6. Seed Test Villager User (matching Figma designs: B. Balaji)
    const villagerPinHash = bcrypt.hashSync("1234", 10);
    const [villagerUser] = await db
      .insert(users)
      .values({
        fullName: "B. Balaji",
        fathersName: "B. Ramesh",
        mothersName: "B. Lakshmi",
        phone: "9812345678",
        pinHash: villagerPinHash,
        role: "VILLAGER",
        gramPanchayatId: machnoorId,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const villagerId = villagerUser
      ? villagerUser.id
      : (await db.select().from(users).where(eq(users.phone, "9812345678")))[0]?.id;

    console.log("✅ Villager user seeded (Phone: 9812345678, PIN: 1234)");

    // 7. Seed Sample Complaints (Matching Figma Screenshots)
    if (villagerId) {
      const sampleComplaints = [
        {
          complaintId: "GP-2026-0481",
          villagerId: villagerId,
          sarpanchId: sarpanchId,
          category: "Roads & Infrastructure",
          description: "Main road damage near Machnoor Gram Panchayat school gate. Large potholes causing difficulty for daily commuters and school buses.",
          status: "UNDER_PROCESS",
          priority: "HIGH",
          officialRemarks: "Inspection done by Panchayat Secretary. Road repair sanctioned.",
        },
        {
          complaintId: "GP-2026-0399",
          villagerId: villagerId,
          sarpanchId: sarpanchId,
          category: "Water & Drainage",
          description: "Water pipeline leakage near South Street water tank. Drinking water is getting wasted.",
          status: "UNDER_PROCESS",
          priority: "HIGH",
          officialRemarks: "Pipe repair technician dispatched.",
        },
        {
          complaintId: "GP-2026-0312",
          villagerId: villagerId,
          sarpanchId: sarpanchId,
          category: "Sanitation & Cleanliness",
          description: "Garbage collection delayed in Ward 3 for 4 days. Need immediate cleaning.",
          status: "RESOLVED",
          priority: "MEDIUM",
          officialRemarks: "Sanitation team deployed and site cleaned completely.",
        },
        {
          complaintId: "GP-2026-0205",
          villagerId: villagerId,
          sarpanchId: sarpanchId,
          category: "Govt Services & Certificates",
          description: "Inquiry regarding Gram Sabha meeting agenda and street lighting approval.",
          status: "CLOSED",
          priority: "LOW",
          officialRemarks: "Information provided to villager during Gram Panchayat session.",
        },
      ];

      for (const item of sampleComplaints) {
        const [c] = await db
          .insert(complaints)
          .values({
            ...item,
            voiceUrl: null,
            imageUrls: [],
          })
          .onConflictDoNothing()
          .returning();

        if (c) {
          await db.insert(complaintTimeline).values({
            complaintId: c.id,
            previousStatus: "SUBMITTED",
            newStatus: item.status,
            remarks: item.officialRemarks,
            updatedBy: sarpanchId,
          });
        }
      }
      console.log("✅ Sample complaints seeded (GP-2026-0481, GP-2026-0399, etc.)");
    }

    console.log("🌿 Comprehensive seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    process.exit(0);
  }
}

seed();
