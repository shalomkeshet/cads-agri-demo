import crypto from "crypto";
import type { VercelRequest } from "@vercel/node";

const COOKIE_NAME = "demo_session";

export function createDemoSessionCookie({ demoId }: { demoId: string }) {
  const secret = process.env.DEMO_SESSION_SECRET!;
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    demoId,
    role: "demo",
    iat: now,
    exp: now + 60 * 60 * 24, // 24h
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

export async function verifyDemoSession(req: VercelRequest) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader
    .split("; ")
    .find((c: string) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;

  const value = match.split("=")[1];
  if (!value) return null;

  const decoded = Buffer.from(value, "base64url").toString("utf8");
  const [json, sig] = decoded.split(".");
  if (!json || !sig) return null;

  const secret = process.env.DEMO_SESSION_SECRET!;
  const expected = crypto.createHmac("sha256", secret).update(json).digest("hex");
  if (expected !== sig) return null;

  const payload = JSON.parse(json);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return null;

  return { type: "demo", role: "demo", demoId: payload.demoId } as const;
}
