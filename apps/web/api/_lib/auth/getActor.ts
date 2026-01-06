import type { VercelRequest } from "@vercel/node";
import { verifyDemoSession } from "./demoSession";

export async function getActor(req: VercelRequest) {
  const demoActor = await verifyDemoSession(req);
  if (demoActor) return demoActor;
  return null;
}
