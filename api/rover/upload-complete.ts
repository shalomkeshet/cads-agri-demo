import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../../packages/auth/requireActor";
import { db } from "../../packages/db/client";
import { observations } from "../../packages/db/schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  const { zoneId, blobUrl } = req.body || {};
  if (!zoneId || !blobUrl) {
    return res.status(400).json({ error: "zoneId and blobUrl required" });
  }

  const [row] = await db
    .insert(observations)
    .values({
      zoneId,
      type: "image",
      imageUrl: blobUrl,
    })
    .returning();

  res.status(200).json({ ok: true, observation: row });
}
