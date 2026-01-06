// import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { requireActor } from "../../../packages/auth/requireActor";
// import { db } from "../../../packages/db/client";
// import { recommendations } from "../../../packages/db/schema";
// import { generateDCI } from "../../../packages/dci-engine/generate";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../_lib/auth/requireActor";
import { db } from "../_lib/db/client";
import { recommendations } from "../_lib/db/schema";
import { generateDCI } from "../_lib/dci/generate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  const { zoneId } = req.body || {};
  if (!zoneId) return res.status(400).json({ error: "zoneId required" });

  const { dciScore, recommendationType, explanationSummary } = generateDCI();

  const [row] = await db
    .insert(recommendations)
    .values({
      zoneId,
      dciScore,
      recommendationType,
      explanationSummary,
    })
    .returning();

  res.status(200).json({ ok: true, recommendation: row });
}
