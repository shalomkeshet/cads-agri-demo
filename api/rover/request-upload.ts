import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireActor } from "../../packages/auth/requireActor";
import { put } from "@vercel/blob";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType required" });
  }

  // Create a blob upload URL (direct upload supported)
  const blob = await put(`rover-scans/${Date.now()}-${filename}`, {
    access: "public",
    contentType,
  });

  // blob.url is the final public URL
  res.status(200).json({
    uploadUrl: blob.url, // for demo: client can upload directly to this URL using PUT
    blobUrl: blob.url
  });
}
