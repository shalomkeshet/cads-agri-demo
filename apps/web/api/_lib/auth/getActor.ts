import type { VercelRequest } from "@vercel/node";
// import { verifyDemoSession } from "./demoSession";
import { verifyDemoSession } from "./demoSession.js";

export async function getActor(req: VercelRequest) {
  const demoActor = await verifyDemoSession(req);
  if (demoActor) return demoActor;
  return null;
}
