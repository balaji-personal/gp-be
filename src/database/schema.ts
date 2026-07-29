import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  state: varchar("state", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mandals = pgTable(
  "mandals",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    districtId: integer("district_id").notNull().references(() => districts.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    districtIdIdx: index("mandal_district_idx").on(table.districtId),
  })
);

export const gramPanchayats = pgTable(
  "gram_panchayats",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    mandalId: integer("mandal_id").notNull().references(() => mandals.id),
    districtId: integer("district_id").notNull().references(() => districts.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    mandalIdIdx: index("gp_mandal_idx").on(table.mandalId),
    districtIdIdx: index("gp_district_idx").on(table.districtId),
  })
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    fathersName: varchar("fathers_name", { length: 100 }).notNull(),
    mothersName: varchar("mothers_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 10 }).notNull().unique(),
    pinHash: varchar("pin_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).default("VILLAGER"),
    isActive: boolean("is_active").default(true),
    gramPanchayatId: integer("gram_panchayat_id").references(() => gramPanchayats.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    phoneIdx: index("user_phone_idx").on(table.phone),
    roleIdx: index("user_role_idx").on(table.role),
    gpIdx: index("user_gp_idx").on(table.gramPanchayatId),
  })
);

export const complaints = pgTable(
  "complaints",
  {
    id: serial("id").primaryKey(),
    complaintId: varchar("complaint_id", { length: 50 }).notNull().unique(),
    villagerId: integer("villager_id").notNull().references(() => users.id),
    sarpanchId: integer("sarpanch_id").references(() => users.id),
    category: varchar("category", { length: 50 }).notNull(),
    description: text("description").notNull(),
    voiceUrl: varchar("voice_url", { length: 500 }),
    imageUrls: jsonb("image_urls").default([]),
    status: varchar("status", { length: 20 }).default("SUBMITTED"),
    priority: varchar("priority", { length: 20 }).default("MEDIUM"),
    officialRemarks: text("official_remarks"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    complaintIdIdx: index("complaint_id_idx").on(table.complaintId),
    villagerIdIdx: index("complaint_villager_idx").on(table.villagerId),
    sarpanchIdIdx: index("complaint_sarpanch_idx").on(table.sarpanchId),
    statusIdx: index("complaint_status_idx").on(table.status),
  })
);

export const complaintTimeline = pgTable(
  "complaint_timeline",
  {
    id: serial("id").primaryKey(),
    complaintId: integer("complaint_id").notNull().references(() => complaints.id),
    previousStatus: varchar("previous_status", { length: 20 }),
    newStatus: varchar("new_status", { length: 20 }).notNull(),
    remarks: text("remarks"),
    updatedBy: integer("updated_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    complaintIdIdx: index("timeline_complaint_idx").on(table.complaintId),
  })
);

export const usersRelations = relations(users, ({ many, one }) => ({
  complaints: many(complaints),
  complaintsAssigned: many(complaints),
  gramPanchayat: one(gramPanchayats, {
    fields: [users.gramPanchayatId],
    references: [gramPanchayats.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  villager: one(users, {
    fields: [complaints.villagerId],
    references: [users.id],
  }),
  sarpanch: one(users, {
    fields: [complaints.sarpanchId],
    references: [users.id],
  }),
  timeline: many(complaintTimeline),
}));

export const gramPanchayatsRelations = relations(gramPanchayats, ({ many, one }) => ({
  users: many(users),
  mandal: one(mandals, {
    fields: [gramPanchayats.mandalId],
    references: [mandals.id],
  }),
}));

export const mandalsRelations = relations(mandals, ({ many, one }) => ({
  gramPanchayats: many(gramPanchayats),
  district: one(districts, {
    fields: [mandals.districtId],
    references: [districts.id],
  }),
}));

export const districtsRelations = relations(districts, ({ many }) => ({
  mandals: many(mandals),
}));

export const complaintTimelineRelations = relations(
  complaintTimeline,
  ({ one }) => ({
    complaint: one(complaints, {
      fields: [complaintTimeline.complaintId],
      references: [complaints.id],
    }),
    updatedByUser: one(users, {
      fields: [complaintTimeline.updatedBy],
      references: [users.id],
    }),
  })
);
