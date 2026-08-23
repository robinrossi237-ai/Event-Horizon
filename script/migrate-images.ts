import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { db } from "../server/db";
import { events } from "@shared/schema";
import { eq } from "drizzle-orm";

// Node 18+ has fetch globally
async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ensureDir(p: string) {
  try {
    await fs.mkdir(p, { recursive: true });
  } catch (e) {}
}

async function main() {
  const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
  await ensureDir(uploadDir);

  const rows = await db.select().from(events).all();
  console.log(`Found ${rows.length} events`);

  for (const ev of rows) {
    try {
      const current = (ev as any).imageUrl as string | null;
      if (!current) continue;
      if (current.startsWith("/objects/")) {
        console.log(`Event ${ev.id} already uses local object path, skipping`);
        continue;
      }
      if (!/^https?:\/\//.test(current)) {
        console.log(`Event ${ev.id} imageUrl is not an http url: ${current}, skipping`);
        continue;
      }

      console.log(`Downloading image for event ${ev.id} from ${current}`);
      const buffer = await download(current);
      // derive filename
      let parsedName = "image";
      try {
        const u = new URL(current);
        parsedName = path.basename(u.pathname) || "image";
      } catch (e) {}
      const safeName = `${Date.now()}-${parsedName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const dest = path.join(uploadDir, safeName);
      await fs.writeFile(dest, buffer);

      const newPath = `/objects/uploads/${safeName}`;
      await db.update(events).set({ imageUrl: newPath as any }).where(eq(events.id, ev.id));
      console.log(`Updated event ${ev.id} imageUrl -> ${newPath}`);
    } catch (err) {
      console.error(`Failed to migrate image for event ${ev.id}:`, err);
    }
  }

  console.log("Image migration complete");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
