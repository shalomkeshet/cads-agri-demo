import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db/client.js";
import { recommendations } from "../_lib/db/schema.js";
import { eq } from "drizzle-orm";

type Body = {
  recommendationId: string;
  action: "approve" | "reject" | "execute";
  decisionBy?: string;
  decisionNote?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as Body;

    const { recommendationId, action, decisionBy, decisionNote } = body;

    if (!recommendationId) {
      return res.status(400).json({ error: "recommendationId required" });
    }

    if (!action || !["approve", "reject", "execute"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const now = new Date();

    let decisionStatus: "approved" | "rejected" | "executed";
    if (action === "approve") decisionStatus = "approved";
    else if (action === "reject") decisionStatus = "rejected";
    else decisionStatus = "executed";

    const updateData: any = {
      decisionStatus,
      decisionBy: decisionBy || null,
      decisionNote: decisionNote || null,
      decisionAt: now,
    };

    if (decisionStatus === "executed") {
      updateData.executedAt = now;
    }

    const updated = await db
      .update(recommendations)
      .set(updateData)
      .where(eq(recommendations.id, recommendationId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    return res.status(200).json({ ok: true, recommendation: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update recommendation decision" });
  }
}
