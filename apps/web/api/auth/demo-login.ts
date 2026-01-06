import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDemoSessionCookie } from "../../../packages/auth/demoSession";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { passcode } = req.body || {};
    if (!passcode) return res.status(400).json({ error: "Passcode required" });

    const expected = process.env.DEMO_PASSCODE;
    if (!expected) {
      return res.status(500).json({ error: "Missing DEMO_PASSCODE env var on server" });
    }

    if (!process.env.DEMO_SESSION_SECRET) {
      return res.status(500).json({ error: "Missing DEMO_SESSION_SECRET env var on server" });
    }

    if (passcode !== expected) {
      return res.status(401).json({ error: "Invalid passcode" });
    }

    const demoId = process.env.DEMO_ID || "demo-farm-001";
    const cookie = createDemoSessionCookie({ demoId });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("demo-login error:", err);
    return res.status(500).json({
      error: "demo-login crashed",
      message: err?.message || String(err),
    });
  }
}
