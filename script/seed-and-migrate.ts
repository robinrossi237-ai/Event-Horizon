import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import { db } from "../server/db";
import { events, tickets } from "@shared/schema";
import { eq } from "drizzle-orm";

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ensureDir(p: string) {
  try { await fs.mkdir(p, { recursive: true }); } catch (e) {}
}

const SAMPLE_EVENTS = [
  {
    title: "Summer Music Festival",
    description: "The biggest music festival of the year featuring top artists.",
    date: new Date("2025-07-15T18:00:00Z"),
    location: "Central Park, NY",
    category: "Music",
    imageUrl: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&w=1000&q=80",
    tickets: [
      { name: "General Admission", price: "50", quantity: 1000 },
      { name: "VIP", price: "150", quantity: 200 },
    ],
  },
  {
    title: "Tech Conference 2025",
    description: "Join industry leaders to learn about the future of technology.",
    date: new Date("2025-09-10T09:00:00Z"),
    location: "Moscone Center, SF",
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1531266752504-2a4b6f3b2f66?auto=format&fit=crop&w=1000&q=80",
    tickets: [
      { name: "Standard", price: "120", quantity: 500 },
      { name: "Student", price: "40", quantity: 200 },
    ],
  },
  {
    title: "Art & Wine Night",
    description: "An evening of local art, craft beer and wines.",
    date: new Date("2025-06-05T19:00:00Z"),
    location: "Old Town Hall",
    category: "Social",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
    tickets: [
      { name: "Entry", price: "25", quantity: 300 },
    ],
  },
  {
    title: "Marathon for Charity",
    description: "Run to support local charities and community programs.",
    date: new Date("2025-11-02T07:00:00Z"),
    location: "Citywide",
    category: "Sports",
    imageUrl: "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1000&q=80",
    tickets: [
      { name: "Participant", price: "30", quantity: 2000 },
      { name: "Spectator", price: "10", quantity: 5000 },
    ],
  },
  {
    title: "Food Truck Fiesta",
    description: "Taste foods from the best food trucks in the region.",
    date: new Date("2025-08-20T12:00:00Z"),
    location: "Riverfront Park",
    category: "Food",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
    tickets: [
      { name: "Free Entry", price: "0", quantity: 10000 },
    ],
  },
];

async function main() {
  const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
  await ensureDir(uploadDir);

  // Insert sample events if none exist
  const existing = await db.select().from(events).all();
  if (existing.length === 0) {
    console.log("No events found — inserting sample events...");
    for (const ev of SAMPLE_EVENTS) {
      const [newEv] = await db.insert(events).values({
        title: ev.title,
        description: ev.description,
        date: ev.date as any,
        location: ev.location,
        category: ev.category,
        imageUrl: ev.imageUrl,
        organizerId: "seed-organizer",
      } as any).returning();

      for (const t of ev.tickets) {
        await db.insert(tickets).values({ ...t, eventId: newEv.id, available: t.quantity } as any);
      }

      console.log(`Inserted event ${newEv.id} - ${newEv.title}`);
    }
  } else {
    console.log(`Found ${existing.length} existing events, skipping insert.`);
  }

  // Migrate remote image URLs to local uploads
  const rows = await db.select().from(events).all();
  console.log(`Processing ${rows.length} events for image migration`);

  for (const ev of rows) {
    try {
      const current = (ev as any).imageUrl as string | null;
      if (!current) continue;
      if (current.startsWith("/objects/")) {
        console.log(`Event ${ev.id} already local, skipping`);
        continue;
      }
      if (!/^https?:\/\//.test(current)) {
        console.log(`Event ${ev.id} imageUrl not http(s): ${current}, skipping`);
        continue;
      }

      console.log(`Downloading image for event ${ev.id} from ${current}`);
      const buffer = await download(current);
      let parsedName = "image";
      try { const u = new URL(current); parsedName = path.basename(u.pathname) || "image"; } catch (e) {}
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

  console.log("Seeding and image migration complete");
}

main().catch((err) => { console.error(err); process.exit(1); });
