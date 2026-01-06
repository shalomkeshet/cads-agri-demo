import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDemoSessionCookie } from "../../../packages/auth/demoSession";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { passcode } = req.body || {};
  if (!passcode) return res.status(400).json({ error: "Passcode required" });

  if (passcode !== process.env.DEMO_PASSCODE) {
    return res.status(401).json({ error: "Invalid passcode" });
  }

  const demoId = process.env.DEMO_ID || "demo-farm-001";
  const cookie = createDemoSessionCookie({ demoId });

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true });
}
