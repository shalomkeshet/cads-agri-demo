import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../../../packages/auth/requireActor";
import { put } from "@vercel/blob";
import { db } from "../../../packages/db/client";
import { observations } from "../../../packages/db/schema";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  const zoneId = req.query.zoneId as string;
  if (!zoneId) {
    return res.status(400).json({ error: "zoneId query param required" });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks);

  if (!body.length) return res.status(400).json({ error: "Empty upload body" });

  const contentType = String(req.headers["content-type"] || "image/jpeg");
  const filename = String(req.headers["x-filename"] || `scan-${Date.now()}.jpg`);

  const blob = await put(`rover-scans/${Date.now()}-${filename}`, body, {
    access: "public",
    contentType,
  });

  const [row] = await db
    .insert(observations)
    .values({
      zoneId,
      type: "image",
      imageUrl: blob.url,
    })
    .returning();

  res.status(200).json({ ok: true, blobUrl: blob.url, observation: row });
}
