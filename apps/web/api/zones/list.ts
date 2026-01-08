import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db/client.js";
import { zones } from "../_lib/db/schema.js";
import { isNull } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const includeArchived =
    req.query?.includeArchived === "1" ||
    req.query?.includeArchived === "true";

  const baseQuery = db
    .select({
      id: zones.id,
      farmId: zones.farmId,
      name: zones.name,
      cropType: zones.cropType,
      archivedAt: zones.archivedAt, // ✅ NEW
      createdAt: zones.createdAt,
    })
    .from(zones);

  const rows = includeArchived
    ? await baseQuery
    : await baseQuery.where(isNull(zones.archivedAt));

  return res.status(200).json(rows);
}
