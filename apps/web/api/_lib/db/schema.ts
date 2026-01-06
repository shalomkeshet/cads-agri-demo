import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const farms = pgTable("farms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const zones = pgTable("zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const observations = pgTable("observations", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull(),
  type: text("type").notNull(), // "image"
  imageUrl: text("image_url"),  // Vercel Blob URL
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id").notNull(),
  recommendationType: text("recommendation_type").notNull(), // "inspect" | "irrigate" | "pest_check"
  dciScore: integer("dci_score").notNull(), // 0-100
  explanationSummary: text("explanation_summary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
