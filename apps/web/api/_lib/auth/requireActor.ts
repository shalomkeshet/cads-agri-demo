import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { getActor } from "./getActor";
import { getActor } from "./getActor.js";

export async function requireActor(req: VercelRequest, res: VercelResponse) {
  const actor = await getActor(req);

  if (!actor) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return actor;
}
