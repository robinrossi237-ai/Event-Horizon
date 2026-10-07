import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { db, pool } from "../server/db";
import { events, tickets, users } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

const UPLOAD_DIR = path.join(process.cwd(), "attached_assets", "uploads");
const IMAGE_BASE = "https://images.unsplash.com/photo-";

type SampleEvent = {
  title: string;
  slug: string;
  description: string;
  date: Date;
  location: string;
  category: string;
  photoId?: string;
  query?: string;
  isPromoted?: boolean;
  tickets: { name: string; price: string; quantity: number }[];
};

const SAMPLE_EVENTS: SampleEvent[] = [
  {
    title: "Afrobeat Sunset Live",
    slug: "afrobeat-sunset-live",
    description:
      "The biggest Afrobeat night of the season. Live band, LED stage, dancers and a sunset set on the beachfront. Come early for the opening act and food stalls.",
    date: new Date("2026-10-24T18:00:00Z"),
    location: "Beachfront, Kribi",
    category: "Music",
    photoId: "1492684223066-81342ee5ff30",
    isPromoted: true,
    tickets: [
      { name: "Regular", price: "10000", quantity: 800 },
      { name: "VIP", price: "35000", quantity: 150 },
    ],
  },
  {
    title: "Rhumba & Dance Night",
    slug: "rhumba-dance-night",
    description:
      "Cameroonian rhumba legends meet modern afropop for a night of non-stop dance. Two stages, live bands and a strict 21+ policy after 22:00.",
    date: new Date("2026-11-07T20:00:00Z"),
    location: "Palais des Congres, Yaounde",
    category: "Music",
    photoId: "1501386761578-eac5c94b800a",
    tickets: [
      { name: "Standard", price: "7500", quantity: 600 },
      { name: "Balcony", price: "18000", quantity: 120 },
    ],
  },
  {
    title: "Douala Digital Summit",
    slug: "douala-digital-summit",
    description:
      "Two days with the engineers, founders and investors building West Africa's digital economy. Keynotes, startup booths and hands-on product clinics.",
    date: new Date("2026-11-19T09:00:00Z"),
    location: "Bonanjo Congress Centre, Douala",
    category: "Technology",
    photoId: "1540575467063-178a50c2df87",
    isPromoted: true,
    tickets: [
      { name: "Conference Pass", price: "25000", quantity: 900 },
      { name: "Student", price: "10000", quantity: 250 },
    ],
  },
  {
    title: "AI & Cloud Masterclass",
    slug: "ai-cloud-masterclass",
    description:
      "A full-day, hands-on workshop on deploying production AI models on the cloud. Bring your laptop; all cloud credits are provided. Limited to 40 seats.",
    date: new Date("2026-10-31T08:30:00Z"),
    location: "IUT Annexe, Bafoussam",
    category: "Workshop",
    photoId: "1524178232363-1fb2b075b655",
    tickets: [
      { name: "Standard Seat", price: "20000", quantity: 40 },
      { name: "Early Bird", price: "15000", quantity: 15 },
    ],
  },
  {
    title: "Startup Founders Mixer",
    slug: "startup-founders-mixer",
    description:
      "Pitch, network and grab dinner with founders and mentors from the Cameroonian startup scene. Every attendee gets three speed-meeting slots.",
    date: new Date("2026-11-13T18:00:00Z"),
    location: "Wouri Business Hub, Douala",
    category: "Business",
    photoId: "1552664730-d307ca884978",
    tickets: [
      { name: "General Admission", price: "12000", quantity: 300 },
      { name: "Mentor Pass", price: "0", quantity: 40 },
    ],
  },
  {
    title: "SME & Finance Expo",
    slug: "sme-finance-expo",
    description:
      "Mobile money, bank loans, bookkeeping and tax clinics for small and medium businesses. Free entry for the first 300 visitors each day.",
    date: new Date("2026-12-05T09:00:00Z"),
    location: "Limbe Trade Fair Grounds",
    category: "Business",
    photoId: "1542744173-8e7e53415bb0",
    tickets: [
      { name: "Entry", price: "0", quantity: 1000 },
      { name: "VIP Lounge", price: "30000", quantity: 80 },
    ],
  },
  {
    title: "Mount Cameroon Half Marathon",
    slug: "mount-cameroon-half-marathon",
    description:
      "21km around the mountain with chip timing, water stations and finisher medals. Entry includes a medical check point at the start village.",
    date: new Date("2026-11-28T06:00:00Z"),
    location: "Buea City Stadium, Buea",
    category: "Sports",
    photoId: "1461896836934-ffe607ba8211",
    isPromoted: true,
    tickets: [
      { name: "Runner", price: "15000", quantity: 1500 },
      { name: "Spectator", price: "5000", quantity: 3000 },
    ],
  },
  {
    title: "Regional Derby Cup Final",
    slug: "regional-derby-cup-final",
    description:
      "The biggest football fixture of the regional championship, decided over ninety minutes and penalties if needed. Drum band and fan zone from 16:00.",
    date: new Date("2026-12-12T16:00:00Z"),
    location: "Municipal Stadium, Garoua",
    category: "Sports",
    photoId: "1517649763962-0c623066013b",
    tickets: [
      { name: "Tribune", price: "5000", quantity: 2000 },
      { name: "VIP Tribune", price: "20000", quantity: 200 },
    ],
  },
  {
    title: "Modern Art & Craft Expo",
    slug: "modern-art-craft-expo",
    description:
      "Twenty artists, live painting demonstrations and a market of hand-made crafts. Free entry for children under 12 with a paying adult.",
    date: new Date("2026-12-20T10:00:00Z"),
    location: "Arts Centre, Ngaoundere",
    category: "Arts",
    photoId: "1561214115-f2f134cc4912",
    tickets: [
      { name: "Day Pass", price: "3000", quantity: 500 },
      { name: "Artist Booth", price: "40000", quantity: 20 },
    ],
  },
  {
    title: "Street Food & Grill Festival",
    slug: "street-food-grill-festival",
    description:
      "Forty grill masters, live cooking demos and a family zone. Taste plates start at 1000 Fcfa. Bring your own cooler box, we sell ice on site.",
    date: new Date("2026-11-21T11:00:00Z"),
    location: "Riverfront Park, Dschang",
    category: "Food",
    photoId: "1504674900247-0877df9cc836",
    tickets: [
      { name: "Entry", price: "2000", quantity: 2000 },
      { name: "Gourmet Pass", price: "15000", quantity: 300 },
    ],
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;
// Every event in this batch expires between 14 and 21 days from now.
const WINDOW_START = new Date(Date.now() + 14 * DAY_MS);
function slotDate(index: number): Date {
  const d = new Date(WINDOW_START.getTime() + Math.floor(index / 3) * DAY_MS);
  d.setUTCHours([10, 15, 19][index % 3], 0, 0, 0);
  return d;
}

const MORE_EVENTS: SampleEvent[] = [
  {
    title: "Jazz Under the Stars",
    slug: "jazz-under-the-stars",
    description: "An open-air evening of smooth jazz and bossa nova with a live quartet. Terrace seating, cocktail bar and a late-night acoustic set.",
    date: slotDate(0), location: "Wouri Bayfront, Douala", category: "Music",
    query: "jazz band concert stage",
    tickets: [{ name: "Terrace", price: "12000", quantity: 400 }, { name: "VIP Table", price: "45000", quantity: 60 }],
  },
  {
    title: "Blockchain & Fintech Summit",
    slug: "blockchain-fintech-summit",
    description: "Regulators, banks and builders meet to talk mobile money, digital payments and blockchain infrastructure for African markets.",
    date: slotDate(1), location: "West Zone Hotel, Yaounde", category: "Technology",
    query: "blockchain cryptocurrency conference",
    isPromoted: true,
    tickets: [{ name: "Pass", price: "25000", quantity: 500 }, { name: "Investor", price: "60000", quantity: 80 }],
  },
  {
    title: "Beach Volleyball Open",
    slug: "beach-volleyball-open",
    description: "Thirty-two teams, three days of sand volleyball on the Atlantic coast. Entry includes team kit and two water bottles per player.",
    date: slotDate(2), location: "Kribi Beach", category: "Sports",
    query: "beach volleyball players",
    tickets: [{ name: "Player", price: "10000", quantity: 256 }, { name: "Spectator", price: "3000", quantity: 1200 }],
  },
  {
    title: "Urban Lens Photo Exhibition",
    slug: "urban-lens-photo-exhibition",
    description: "Forty prints documenting city life across Cameroon, plus a projection room of black and white archives. Open all day, guided tours at 14:00.",
    date: slotDate(3), location: "Genesis Cultural Centre, Douala", category: "Arts",
    query: "photography exhibition gallery",
    tickets: [{ name: "Entry", price: "3000", quantity: 600 }, { name: "Guided Tour", price: "8000", quantity: 120 }],
  },
  {
    title: "Career & Jobs Fair",
    slug: "career-jobs-fair",
    description: "Sixty employers, resume clinics and on-the-spot interviews. Bring ten printed CVs; dress code is business casual.",
    date: slotDate(4), location: "University of Buea Grounds", category: "Business",
    query: "career fair job seekers",
    tickets: [{ name: "Job Seeker", price: "0", quantity: 2500 }, { name: "Recruiter Booth", price: "60000", quantity: 60 }],
  },
  {
    title: "Brunch & Coffee Festival",
    slug: "brunch-coffee-festival",
    description: "Twelve roasters, latte art battles and a bottomless brunch buffet. Kids under 10 eat free with a paying parent.",
    date: slotDate(5), location: "Jardin Botanique, Yaounde", category: "Food",
    query: "coffee festival barista",
    tickets: [{ name: "Entry", price: "4000", quantity: 900 }, { name: "Gourmet Pass", price: "15000", quantity: 150 }],
  },
  {
    title: "Digital Marketing Workshop",
    slug: "digital-marketing-workshop",
    description: "Full-day hands-on session on ads, analytics and content strategy. You leave with a live campaign and a measured first week of data.",
    date: slotDate(6), location: "Camtel Hub, Bafoussam", category: "Workshop",
    query: "digital marketing workshop",
    tickets: [{ name: "Seat", price: "10000", quantity: 60 }, { name: "Early Bird", price: "7000", quantity: 20 }],
  },
  {
    title: "Young Professionals Mixer",
    slug: "young-professionals-mixer",
    description: "Speed networking in four rounds of eight minutes, then an open bar until closing. Name tags and industry tags are provided.",
    date: slotDate(7), location: "Sawa Tower Rooftop, Douala", category: "Networking",
    query: "networking event people",
    tickets: [{ name: "Standard", price: "7500", quantity: 250 }, { name: "Corporate Table", price: "50000", quantity: 12 }],
  },
  {
    title: "Gospel Praise Concert",
    slug: "gospel-praise-concert",
    description: "Mass choir, mass band and guest soloists for a three-hour night of praise. Free entry for church groups of ten or more.",
    date: slotDate(8), location: "Independence Square, Limbe", category: "Music",
    query: "gospel choir singing",
    tickets: [{ name: "Free Seat", price: "0", quantity: 3000 }, { name: "Front Row", price: "12000", quantity: 300 }],
  },
  {
    title: "Cybersecurity Forum",
    slug: "cybersecurity-forum",
    description: "Incident responders and CERT teams share war stories, live attack demos and a tabletop exercise you can join with your team.",
    date: slotDate(9), location: "Digital Switch Room, Douala", category: "Technology",
    query: "cyber security conference",
    tickets: [{ name: "Pass", price: "20000", quantity: 350 }, { name: "Team of 4", price: "65000", quantity: 40 }],
  },
  {
    title: "Championship Boxing Night",
    slug: "championship-boxing-night",
    description: "Nine bouts including a national title fight. Doors open at 17:00, main event at 21:00 sharp.",
    date: slotDate(10), location: "Palais des Sports, Yaounde", category: "Sports",
    query: "boxing match ring",
    tickets: [{ name: "Ringside", price: "30000", quantity: 120 }, { name: "Stand", price: "10000", quantity: 900 }],
  },
  {
    title: "Stand-up Comedy Night",
    slug: "standup-comedy-night",
    description: "Five comedians, one open mic slot and a no-phones rule during sets. Language mix of English, French and Pidgin.",
    date: slotDate(11), location: "French Cultural Centre, Douala", category: "Arts",
    query: "stand up comedy stage microphone",
    tickets: [{ name: "Standard", price: "5000", quantity: 300 }, { name: "Front Table", price: "15000", quantity: 60 }],
  },
  {
    title: "SME Export & Trade Forum",
    slug: "sme-export-trade-forum",
    description: "Customs, logistics and finance experts break down how to actually export from Cameroon. Live clinic slots with clearing agents.",
    date: slotDate(12), location: "Douala Port Conference Hall", category: "Business",
    query: "international trade forum business",
    tickets: [{ name: "Delegate", price: "15000", quantity: 300 }, { name: "VIP", price: "40000", quantity: 60 }],
  },
  {
    title: "Atlantic Seafood Fair",
    slug: "atlantic-seafood-fair",
    description: "Catch of the day straight from the boats, grilled prawns and crab workshops for kids. Everything sold by weight.",
    date: slotDate(13), location: "New Beach, Kribi", category: "Food",
    query: "seafood market fish",
    tickets: [{ name: "Entry", price: "2000", quantity: 1500 }, { name: "Chef's Table", price: "8000", quantity: 80 }],
  },
  {
    title: "Photography Masterclass",
    slug: "photography-masterclass",
    description: "Lighting, composition and editing taught through practical shoots with professional gear. Bring your own camera if you have one.",
    date: slotDate(14), location: "Goethe Institute, Yaounde", category: "Workshop",
    query: "photography workshop class",
    tickets: [{ name: "Full Day", price: "12000", quantity: 45 }, { name: "Half Day", price: "7000", quantity: 45 }],
  },
  {
    title: "Developers Meetup & Hack Night",
    slug: "developers-meetup-hack-night",
    description: "Lightning talks at 18:00, then an overnight build sprint with prizes for the best API. Pizza and coffee all night.",
    date: slotDate(15), location: "CoWorking Space, Buea", category: "Networking",
    query: "developers meetup hackathon",
    tickets: [{ name: "Attendee", price: "0", quantity: 200 }, { name: "Hacker", price: "5000", quantity: 100 }],
  },
  {
    title: "Indie Rock Showcase",
    slug: "indie-rock-showcase",
    description: "Four emerging bands, one headliner and a vinyl market in the courtyard. Standing only, ear plugs at the door.",
    date: slotDate(16), location: "Le Baron Club, Yaounde", category: "Music",
    query: "rock band concert",
    tickets: [{ name: "Entry", price: "7000", quantity: 500 }, { name: "Meet the Band", price: "20000", quantity: 50 }],
  },
  {
    title: "Women in Tech Meetup",
    slug: "women-in-tech-meetup",
    description: "Mentorship circles, a salary negotiation clinic and a demo corner for early-stage founders. Childcare available on site.",
    date: slotDate(17), location: "ICT Hub, Douala", category: "Technology",
    query: "women STEM",
    tickets: [{ name: "Member", price: "0", quantity: 180 }, { name: "Non-member", price: "5000", quantity: 120 }],
  },
  {
    title: "City Road Cycling Race",
    slug: "city-road-cycling-race",
    description: "42 km circuit closed to traffic, timed in three waves. Entry includes chip timing, mechanic support and a finisher medal.",
    date: slotDate(18), location: "Bafoussam City Circuit", category: "Sports",
    query: "cycling road race",
    tickets: [{ name: "Rider", price: "6000", quantity: 800 }, { name: "Supporter", price: "2000", quantity: 1500 }],
  },
  {
    title: "Fashion Runway Show",
    slug: "fashion-runway-show",
    description: "Twelve designers, one runway, and a showroom where every look on the catwalk is available to order after the show.",
    date: slotDate(19), location: "C Culturel Francais, Yaounde", category: "Arts",
    query: "fashion runway show model",
    isPromoted: true,
    tickets: [{ name: "Balcony", price: "15000", quantity: 350 }, { name: "Front Row", price: "50000", quantity: 40 }],
  },
  {
    title: "Real Estate & Property Expo",
    slug: "real-estate-property-expo",
    description: "Developers, banks and notaries under one roof with mortgage calculators and free title-deadline consultations.",
    date: slotDate(20), location: "Akwa Palace, Douala", category: "Business",
    query: "real estate conference",
    tickets: [{ name: "Visitor", price: "10000", quantity: 700 }, { name: "Developer Pass", price: "35000", quantity: 90 }],
  },
  {
    title: "Chocolate & Cocoa Tasting",
    slug: "chocolate-cocoa-tasting",
    description: "Bean-to-bar makers walk you through four single-origin tastings and a pairing session with local coffee.",
    date: slotDate(21), location: "Molyko Stadium Walkway, Buea", category: "Food",
    query: "chocolate tasting",
    tickets: [{ name: "Taster", price: "8000", quantity: 160 }, { name: "Maker Tour", price: "20000", quantity: 40 }],
  },
  {
    title: "Public Speaking Masterclass",
    slug: "public-speaking-masterclass",
    description: "Record yourself, get coached live, record again. Every participant leaves with a two-minute filmed pitch.",
    date: slotDate(22), location: "Alliance Francaise, Yaounde", category: "Workshop",
    query: "public speaking presentation audience",
    tickets: [{ name: "Seat", price: "9000", quantity: 50 }, { name: "Corporate Team", price: "30000", quantity: 15 }],
  },
  {
    title: "Charity Gala Mixer",
    slug: "charity-gala-mixer",
    description: "Black-tie dinner, live auction and a keynote on school funding. Proceeds go to the regional scholarship fund.",
    date: slotDate(23), location: "Meridien Ballroom, Douala", category: "Networking",
    query: "charity gala dinner",
    tickets: [{ name: "Guest", price: "30000", quantity: 200 }, { name: "Patron Table", price: "75000", quantity: 20 }],
  },
];

const ALL_EVENTS = [...SAMPLE_EVENTS, ...MORE_EVENTS];

function remoteUrl(photoId: string) {
  return `${IMAGE_BASE}${photoId}?auto=format&fit=crop&w=1400&h=788&q=80`;
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "one", "two",
  "in", "of", "on", "to", "at", "by", "or", "an", "a",
]);

type FoundImage = { url: string; credit?: string; title?: string };

async function searchImage(query: string): Promise<FoundImage> {
  const keywords = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const terms = [query, keywords.slice(0, 2).join(" "), keywords[0]].filter(
    (t, i, arr): t is string => Boolean(t) && arr.indexOf(t) === i,
  );

  const results = await candidates(terms);
  if (results.length === 0) throw new Error(`No Openverse results for "${query}"`);

  const scored = results
    .map((r) => {
      const title = String(r.title || "").toLowerCase();
      const width = Number(r.width) || 0;
      const height = Number(r.height) || 1;
      const score = keywords.filter((k) => title.includes(k)).length;
      return { r, score, width, height, title };
    })
    .sort((a, b) => b.score - a.score || b.width - a.width);

  // Prefer: title keyword match + landscape + reasonably large.
  const best =
    scored.find((c) => c.score >= 1 && c.width >= 800 && c.height >= 500 && c.width / c.height >= 1.1) ||
    scored.find((c) => c.score >= 1 && c.width >= 640) ||
    scored.find((c) => c.score >= 1) ||
    scored[0];

  const license = String(best.r.license || "");
  const version = String(best.r.license_version || "").trim();
  const credit =
    license.startsWith("by") && best.r.creator
      ? `Photo: ${best.r.creator} via ${best.r.provider || "Openverse"} (CC BY${version ? " " + version : ""})`
      : undefined;

  return { url: String(best.r.url), credit, title: String(best.r.title || "").slice(0, 80) };
}

async function candidates(terms: string[]): Promise<any[]> {
  for (const term of terms) {
    for (const license of ["cc0,pdm,by", undefined]) {
      const params = new URLSearchParams({ q: term, page_size: "20", mature: "false" });
      if (license) params.set("license", license);
      try {
        const res = await fetch(`https://api.openverse.org/v1/images/?${params}`);
        if (!res.ok) continue;
        const data: any = await res.json();
        const list: any[] = Array.isArray(data.results) ? data.results : [];
        if (list.length > 0) return list;
      } catch {
        // try next variant
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return [];
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`Unexpected content type "${type}" for ${url}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function ensureImage(ev: SampleEvent): Promise<{ path: string; credit?: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `sample-${ev.slug}.jpg`;
  const dest = path.join(UPLOAD_DIR, fileName);
  const sidecarPath = path.join(UPLOAD_DIR, `sample-${ev.slug}.json`);

  let found: FoundImage | undefined;
  if (existsSync(sidecarPath)) {
    found = JSON.parse(await fs.readFile(sidecarPath, "utf8"));
  }

  if (!existsSync(dest)) {
    if (!found) {
      if (!ev.query) {
        found = { url: remoteUrl(ev.photoId!) };
      } else {
        found = await searchImage(ev.query);
        await new Promise((r) => setTimeout(r, 600));
      }
      await fs.writeFile(sidecarPath, JSON.stringify(found, null, 2));
    }
    await download(found.url, dest);
    console.log(`  downloaded ${fileName} <- ${found.title || found.url}`);
  } else {
    console.log(`  image already present: ${fileName}`);
  }

  return { path: `/objects/uploads/${fileName}`, credit: found?.credit };
}

async function resolveOrganizerId(): Promise<string> {
  const wanted = process.env.SEED_ORGANIZER_EMAIL;
  const all = await db.select().from(users).orderBy(asc(users.createdAt));
  const match = wanted
    ? all.find((u) => u.email?.toLowerCase() === wanted.toLowerCase())
    : all.find((u) => u.isAdmin) || all[0];
  if (!match) throw new Error("No user found to own the sample events (set SEED_ORGANIZER_EMAIL)");
  return match.id;
}

async function main() {
  const organizerId = await resolveOrganizerId();
  console.log(`Seeding sample events for organizer ${organizerId}`);

  let created = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const ev of ALL_EVENTS) {
    const existing = await db.select().from(events).where(eq(events.title, ev.title));
    if (existing.length > 0) {
      console.log(`skip "${ev.title}" (already seeded as id ${existing[0].id})`);
      skipped++;
      continue;
    }

    const image = await ensureImage(ev).catch((err: any) => {
      console.error(`  IMAGE FAILED for "${ev.title}": ${err.message}`);
      failed.push(ev.title);
      return null;
    });
    if (!image) continue;
    const description = image.credit ? `${ev.description} ${image.credit}` : ev.description;
    const [inserted] = await db
      .insert(events)
      .values({
        title: ev.title,
        description,
        date: ev.date,
        location: ev.location,
        category: ev.category,
        imageUrl: image.path,
        organizerId,
        isPromoted: ev.isPromoted ?? false,
      })
      .returning();

    await db.insert(tickets).values(ev.tickets.map((t) => ({
      eventId: inserted.id,
      name: t.name,
      price: t.price,
      quantity: t.quantity,
      available: t.quantity,
    })));

    console.log(`inserted #${inserted.id} ${ev.title} [${ev.category}] ${ev.date.toISOString().slice(0, 16)} -> ${image.path}`);
    created++;
  }

  console.log(`Done. ${created} created, ${skipped} skipped, ${failed.length} image failures.`);
  if (failed.length) {
    console.log(`Images missing for: ${failed.join(", ")}`);
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
