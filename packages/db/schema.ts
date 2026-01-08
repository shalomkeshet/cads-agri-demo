import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const farms = pgTable("farms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const zones = pgTable(
  "zones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id").notNull(),
    name: text("name").notNull(),
    cropType: text("crop_type").notNull().default("Unknown"),

    // NEW: used for archive/unarchive
    archivedAt: timestamp("archived_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    // ✅ Prevent duplicate zone names (case-insensitive) per farm
    uniqueZoneNamePerFarm: uniqueIndex("zones_farm_name_unique").on(
      t.farmId,
      sql`lower(${t.name})`
    ),
  })
);

export const observations = pgTable("observations", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull(),
  type: text("type").notNull(), // "scan"
  imageUrl: text("image_url"), // Vercel Blob URL
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull(),

  recommendationType: text("recommendation_type").notNull(), // "inspect" | "irrigate" | "pest_check"
  dciScore: integer("dci_score").notNull(), // 0-100
  explanationSummary: text("explanation_summary").notNull(),

  // ✅ NEW: Farmer decision tracking
  decisionStatus: text("decision_status").notNull().default("pending"),
  decisionBy: text("decision_by"),
  decisionNote: text("decision_note"),
  decisionAt: timestamp("decision_at"),
  executedAt: timestamp("executed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
