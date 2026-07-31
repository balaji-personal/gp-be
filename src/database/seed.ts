import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { db } from "../config/database";
import { complaintTimeline, complaints, districts, gramPanchayats, mandals, users } from "./schema";

type MappingRow = {
  district: string;
  mandal: string;
  gramPanchayat: string;
};

function readMappingCsv(): MappingRow[] {
  const csvPath = process.env.SEED_CSV_PATH || "C:\\Users\\balaji marpally\\Downloads\\sangareddy_gp_mapping.csv";
  const lines = readFileSync(resolve(csvPath), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [header, ...dataLines] = lines;
  if (header !== "District,Mandal,Gram Panchayat") {
    throw new Error("CSV must have the header: District,Mandal,Gram Panchayat");
  }

  const rows = dataLines.map((line, index) => {
    const [district, mandal, gramPanchayat, ...extraColumns] = line.split(",");
    if (!district || !mandal || !gramPanchayat || extraColumns.length > 0) {
      throw new Error(`Invalid CSV row ${index + 2}: ${line}`);
    }
    return { district, mandal, gramPanchayat };
  });

  if (rows.length === 0 || rows.some((row) => row.district !== "Sangareddy")) {
    throw new Error("CSV must contain Sangareddy location data");
  }

  return rows;
}

async function seed() {
  try {
    const rows = readMappingCsv();
    console.log(`🌱 Resetting database and importing ${rows.length} Sangareddy mappings...`);

    await db.transaction(async (tx) => {
      await tx.delete(complaintTimeline);
      await tx.delete(complaints);
      await tx.delete(users);
      await tx.delete(gramPanchayats);
      await tx.delete(mandals);
      await tx.delete(districts);

      const [district] = await tx
        .insert(districts)
        .values({ name: "Sangareddy", state: "Telangana" })
        .returning({ id: districts.id });

      const mandalNames = [...new Set(rows.map((row) => row.mandal))];
      const mandalRows = await tx
        .insert(mandals)
        .values(mandalNames.map((name) => ({ name, districtId: district.id })))
        .returning({ id: mandals.id, name: mandals.name });
      const mandalIds = new Map(mandalRows.map((row) => [row.name, row.id]));

      await tx.insert(gramPanchayats).values(
        rows.map((row) => ({
          name: row.gramPanchayat,
          mandalId: mandalIds.get(row.mandal)!,
          districtId: district.id,
        }))
      );

      await tx.insert(users).values({
        fullName: "District Collector / Admin",
        fathersName: "Govt of India",
        mothersName: "Telangana State",
        phone: "9999999999",
        pinHash: bcrypt.hashSync("0000", 10),
        role: "ADMIN",
        gramPanchayatId: null,
        isActive: true,
      });
    });

    console.log("✅ Imported Sangareddy district, 26 mandals, and 600 gram panchayats");
    console.log("✅ Admin user seeded (Phone: 9999999999, PIN: 0000)");
    console.log("🌿 Database seeding finished cleanly. No sarpanch or villager accounts were seeded.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();
