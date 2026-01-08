import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload } from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { requireActor } from "../_lib/auth/requireActor.js";
import { db } from "../_lib/db/client.js";
import { observations } from "../_lib/db/schema.js";

/**
 * We keep bodyParser false because one of the actions (upload-file)
 * streams the request body directly.
 */
export const config = {
  api: { bodyParser: false },
};

function getAction(req: VercelRequest) {
  const raw = req.query.action;
  return Array.isArray(raw) ? raw[0] : raw;
}

async function readJsonBody(req: VercelRequest) {
  // Vercel sometimes provides req.body as string
  if (typeof (req as any).body === "string") {
    try {
      return JSON.parse((req as any).body);
    } catch {
      return null;
    }
  }

  // If bodyParser is disabled, req.body may be undefined.
  // In that case, read raw stream and parse JSON.
  if (!(req as any).body) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return (req as any).body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req);

  if (!action) {
    return res.status(400).json({
      error:
        "Missing action query param. Use /api/rover?action=request-upload | upload-complete | upload-file",
    });
  }

  // Require login for all rover endpoints (same as your current files)
  const actor = await requireActor(req, res);
  if (!actor) return;

  /**
   * ✅ Action 1: request-upload
   * Matches old: /api/rover/request-upload
   */
  if (action === "request-upload") {
    if (req.method !== "POST") return res.status(405).end();

    const body = await readJsonBody(req);
    if (body === null) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    // Important: support both "eventType" and "type"
    if ((body as any)?.eventType && !(body as any)?.type) {
      (body as any).type = (body as any).eventType;
      delete (body as any).eventType;
    }

    try {
      const response = await handleUpload({
        request: req,
        body,
        onBeforeGenerateToken: async () => {
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
            tokenPayload: JSON.stringify({ demoId: actor.demoId }),
          };
        },
        onUploadCompleted: async ({ blob }) => {
          // NOTE: This is still safe — it is optional logging
          console.log("Upload completed:", blob.url);
        },
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("rover request-upload error:", error);
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * ✅ Action 2: upload-complete
   * Matches old: /api/rover/upload-complete
   */
  if (action === "upload-complete") {
    if (req.method !== "POST") return res.status(405).end();

    const body = await readJsonBody(req);
    if (body === null) {
      return res.status(400).json({ error: "Invalid JSON body" });
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
      console.error("rover upload-complete error:", err);
      return res.status(500).json({ error: "Failed to save observation" });
    }
  }

  /**
   * ✅ Action 3: upload-file (direct binary upload)
   * Matches old: /api/rover/upload-file?zoneId=...
   */
  if (action === "upload-file") {
    if (req.method !== "POST") return res.status(405).end();

    const zoneIdRaw = req.query.zoneId;
    const zoneId = Array.isArray(zoneIdRaw) ? zoneIdRaw[0] : zoneIdRaw;

    if (!zoneId) {
      return res.status(400).json({ error: "zoneId query param required" });
    }

    try {
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

      return res.status(200).json({ ok: true, blobUrl: blob.url, observation: row });
    } catch (err) {
      console.error("rover upload-file error:", err);
      return res.status(500).json({ error: "Failed to upload file" });
    }
  }

  return res.status(400).json({
    error: `Invalid action "${action}". Use request-upload | upload-complete | upload-file`,
  });
}
