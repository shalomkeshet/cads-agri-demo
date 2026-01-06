import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { requireActor } from "@auth/requireActor";
// import { requireActor } from "../_lib/auth/requireActor";
import { requireActor } from "../_lib/auth/requireActor.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  // For now we just acknowledge upload completed.
  // Later we can trigger recommendation generation, DB insert, etc.
  return res.status(200).json({ ok: true });
}
