import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const COOKIE_NAME = "demo_session";

function createDemoSessionCookie({ demoId }: { demoId: string }) {
  const secret = process.env.DEMO_SESSION_SECRET!;
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    demoId,
    role: "demo",
    iat: now,
    exp: now + 60 * 60 * 24,
  };

  const json = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", secret).update(json).digest("hex");
  const value = Buffer.from(`${json}.${sig}`).toString("base64url");

  const isProd = process.env.NODE_ENV === "production";

  return [
    `${COOKIE_NAME}=${value}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${60 * 60 * 24}`,
    isProd ? `Secure` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { passcode } = req.body || {};
    if (!passcode) return res.status(400).json({ error: "Passcode required" });

    const expected = process.env.DEMO_PASSCODE;
    if (!expected) return res.status(500).json({ error: "Missing DEMO_PASSCODE env var" });

    if (!process.env.DEMO_SESSION_SECRET) {
      return res.status(500).json({ error: "Missing DEMO_SESSION_SECRET env var" });
    }

    if (passcode !== expected) return res.status(401).json({ error: "Invalid passcode" });

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
