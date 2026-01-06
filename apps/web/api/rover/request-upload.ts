import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload } from "@vercel/blob/client";
import { requireActor } from "../_lib/auth/requireActor.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const actor = await requireActor(req, res);
  if (!actor) return;

  // Ensure body is an object (Vercel sometimes gives string)
  let body: any = req.body;

  if (typeof req.body === "string") {
    try {
      body = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
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
        console.log("Upload completed:", blob.url);
      },
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("request-upload error:", error);
    return res.status(400).json({ error: (error as Error).message });
  }
}
