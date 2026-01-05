import "dotenv/config";
import { db } from "../packages/db/client";
import { farms, zones } from "../packages/db/schema";

async function main() {
  const [farm] = await db.insert(farms).values({ name: "Demo Farm" }).returning();
  console.log("Farm:", farm);

  const [zone1] = await db.insert(zones).values({ farmId: farm.id, name: "Zone A" }).returning();
  const [zone2] = await db.insert(zones).values({ farmId: farm.id, name: "Zone B" }).returning();

  console.log("Zone A:", zone1.id);
  console.log("Zone B:", zone2.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
