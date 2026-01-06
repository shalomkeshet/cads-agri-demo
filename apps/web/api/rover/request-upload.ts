import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { requireActor } from "../../../packages/auth/requireActor";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // ✅ must be logged in (demo cookie)
  const actor = await requireActor(req, res);
  if (!actor) return;

  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename + contentType required" });
  }

  try {
    // ✅ Create a signed upload URL
    const blob = await put(`rover-scans/${Date.now()}-${filename}`, {
      access: "public",
      contentType,
    });

    return res.status(200).json({
      uploadUrl: blob.uploadUrl,
      pathname: blob.pathname,
      url: blob.url,
    });
  } catch (err) {
    console.error("request-upload error:", err);
    return res.status(500).json({ error: "Failed to create upload URL" });
  }
}
