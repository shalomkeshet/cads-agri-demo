import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../../packages/auth/requireActor";
import { db } from "../../packages/db/client";
import { observations, recommendations } from "../../packages/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const actor = await requireActor(req, res);
  if (!actor) return;

  const zoneId = req.query.zoneId as string;
  if (!zoneId) return res.status(400).json({ error: "zoneId required" });

  const obs = await db
    .select()
    .from(observations)
    .where(eq(observations.zoneId, zoneId))
    .orderBy(desc(observations.uploadedAt));

  const recs = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.zoneId, zoneId))
    .orderBy(desc(recommendations.createdAt));

  res.status(200).json({ observations: obs, recommendations: recs });
}
