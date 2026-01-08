import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db/client.js";
import { zones } from "../_lib/db/schema.js";
import { eq } from "drizzle-orm";
import { requireActor } from "../_lib/auth/requireActor.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  let body: any = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const id = String(body?.id || "").trim();
  if (!id) return res.status(400).json({ error: "Zone id is required" });

  const [row] = await db
    .update(zones)
    .set({ archivedAt: null })
    .where(eq(zones.id, id))
    .returning({
      id: zones.id,
      name: zones.name,
      cropType: zones.cropType,
      archivedAt: zones.archivedAt,
      createdAt: zones.createdAt,
    });

  if (!row) return res.status(404).json({ error: "Zone not found" });

  return res.status(200).json(row);
}
