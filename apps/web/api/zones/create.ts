import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db/client.js";
import { zones } from "../_lib/db/schema.js";
import { requireActor } from "../_lib/auth/requireActor.js";

const DEMO_FARM_ID = "11111111-1111-1111-1111-111111111111";

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

  const name = String(body?.name || "").trim();
  const cropType = String(body?.cropType || "").trim();

  if (!name) return res.status(400).json({ error: "Zone name is required" });
  if (!cropType) return res.status(400).json({ error: "Crop type is required" });

  const [row] = await db
    .insert(zones)
    .values({
      farmId: DEMO_FARM_ID,
      name,
      cropType,
    })
    .returning({
      id: zones.id,
      name: zones.name,
      cropType: zones.cropType,
      farmId: zones.farmId,
      createdAt: zones.createdAt,
    });

  return res.status(200).json(row);
}
