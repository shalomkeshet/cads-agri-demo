import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../_lib/auth/requireActor.js";
import { db } from "../_lib/db/client.js";
import { recommendations } from "../_lib/db/schema.js";
import { generateDCI } from "../_lib/dci/generate.js";
import { eq } from "drizzle-orm";

type DecisionBody = {
  recommendationId: string;
  action: "approve" | "reject" | "execute";
  decisionBy?: string;
  decisionNote?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireActor(req, res);
  if (!actor) return;

  // We route by query param: /api/recommendations?action=run | decision
  const actionRaw = req.query.action;
  const action = Array.isArray(actionRaw) ? actionRaw[0] : actionRaw;

  // ✅ RUN recommendation
  if (action === "run") {
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
        decisionStatus: "pending",
      })
      .returning();

    return res.status(200).json({ ok: true, recommendation: row });
  }

  // ✅ DECISION approve/reject/execute
  if (action === "decision") {
    const body = req.body as DecisionBody;
    const { recommendationId, action: decisionAction, decisionBy, decisionNote } = body;

    if (!recommendationId) {
      return res.status(400).json({ error: "recommendationId required" });
    }

    if (!decisionAction || !["approve", "reject", "execute"].includes(decisionAction)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const now = new Date();

    let decisionStatus: "approved" | "rejected" | "executed";
    if (decisionAction === "approve") decisionStatus = "approved";
    else if (decisionAction === "reject") decisionStatus = "rejected";
    else decisionStatus = "executed";

    const updateData: any = {
      decisionStatus,
      decisionBy: decisionBy || null,
      decisionNote: decisionNote || null,
      decisionAt: now,
    };

    if (decisionStatus === "executed") updateData.executedAt = now;

    const updated = await db
      .update(recommendations)
      .set(updateData)
      .where(eq(recommendations.id, recommendationId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    return res.status(200).json({ ok: true, recommendation: updated[0] });
  }

  return res.status(400).json({ error: "Invalid action. Use ?action=run or ?action=decision" });
}
