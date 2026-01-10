import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../_lib/auth/requireActor.js";
import { db } from "../_lib/db/client.js";
import { zones, recommendations } from "../_lib/db/schema.js";
import {eq, isNull, desc } from "drizzle-orm";

// ✅ Config: DCI threshold
const STRESS_THRESHOLD = 70;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const actor = await requireActor(req, res);
  if (!actor) return;

  try {
    const includeArchived = req.query.includeArchived === "1";

    // ✅ Load zones (either active only OR include archived)
    const zoneRows = await db
      .select()
      .from(zones)
      .where(includeArchived ? undefined : isNull(zones.archivedAt))
      .orderBy(desc(zones.createdAt));

    // ✅ For each zone, fetch latest recommendation (if any)
    const summaries = await Promise.all(
      zoneRows.map(async (z) => {
        const latestRec = await db
          .select()
          .from(recommendations)
          .where(eq(recommendations.zoneId, z.id))
          .orderBy(desc(recommendations.createdAt))
          .limit(1);

        const rec = latestRec[0] || null;

        const dci = rec?.dciScore ?? null;
        const zoneStatus =
          dci === null ? "unknown" : dci < STRESS_THRESHOLD ? "stressed" : "ok";

        return {
          id: z.id,
          name: z.name,
          cropType: z.cropType,
          archivedAt: z.archivedAt ?? null,
          createdAt: z.createdAt,

          latestRecommendation: rec
            ? {
                id: rec.id,
                recommendationType: rec.recommendationType,
                dciScore: rec.dciScore,
                explanationSummary: rec.explanationSummary,
                decisionStatus: rec.decisionStatus,
                decisionAt: rec.decisionAt,
                executedAt: rec.executedAt,
                createdAt: rec.createdAt,
              }
            : null,

          zoneStatus, // "ok" | "stressed" | "unknown"
        };
      })
    );

    return res.status(200).json({ zones: summaries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load zone summary" });
  }
}
