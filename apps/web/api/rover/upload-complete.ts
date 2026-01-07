import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../_lib/auth/requireActor.js";
import { db } from "../_lib/db/client.js";
import { observations } from "../_lib/db/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  // body might be string in Vercel sometimes
  let body: any = req.body;
  if (typeof req.body === "string") {
    try {
      body = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { zoneId, blobUrl } = body || {};
  if (!zoneId || !blobUrl) {
    return res.status(400).json({ error: "zoneId + blobUrl required" });
  }

  try {
    const [row] = await db
      .insert(observations)
      .values({
        zoneId,
        type: "scan",
        imageUrl: blobUrl,
      })
      .returning();

    return res.status(200).json({ ok: true, observation: row });
  } catch (err) {
    console.error("upload-complete error:", err);
    return res.status(500).json({ error: "Failed to save observation" });
  }
}