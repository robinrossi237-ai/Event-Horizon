import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// node-postgres ignores sslmode in the connection string; honor it (and PGSSLMODE) explicitly.
// Local Postgres typically has no sslmode -> no SSL. Neon/Render set sslmode=require -> SSL.
const sslMode = (
  process.env.PGSSLMODE ||
  process.env.DATABASE_URL.match(/[?&]sslmode=([^&]+)/)?.[1] ||
  "disable"
).toLowerCase();
const useSsl = ["require", "verify-ca", "verify-full", "no-verify"].includes(sslMode);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
