import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../_lib/auth/requireActor.js";
import { db } from "../_lib/db/client.js";
import { observations, recommendations } from "../_lib/db/schema.js";
import { eq, desc } from "drizzle-orm";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  // zoneId may come as string[]
  const raw = req.query.zoneId;
  const zoneId = Array.isArray(raw) ? raw[0] : raw;

  if (!zoneId) {
    return res.status(400).json({ error: "zoneId required" });
  }

  if (!isUuid(zoneId)) {
    return res
      .status(400)
      .json({ error: "Invalid zoneId (must be UUID)", received: zoneId });
  }

  // ✅ Limit results for performance
  const obs = await db
    .select()
    .from(observations)
    .where(eq(observations.zoneId, zoneId))
    .orderBy(desc(observations.uploadedAt))
    .limit(50);

  const recs = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.zoneId, zoneId))
    .orderBy(desc(recommendations.createdAt))
    .limit(50);

  return res.status(200).json({
    observations: obs,
    recommendations: recs,
  });
}
