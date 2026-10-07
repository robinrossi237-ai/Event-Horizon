<!--
  README for Event-Horizon
  Generated: English project manual describing structure, workflow, running, and testing.
-->
# Event-Horizon — Project Guide

## Overview

Event-Horizon is a full-stack web application consisting of a TypeScript/Node.js backend (Express) and a React frontend (Vite + Tailwind). The project provides APIs, session-based authentication, object storage (uploads), and a UI for creating and booking events.

This README explains the project architecture, the role of important files, the typical development workflow, how to run and test the project locally, and common troubleshooting steps.

## Repository structure (high level)

- `client/` — React frontend built with Vite. Contains `src/` (components, hooks, pages), `index.html`, and client configuration.
- `server/` — Backend TypeScript code exposing REST endpoints and handling sessions, storage, and DB interactions.
- `shared/` — Shared types, route definitions, and DB schema used by both client and server.
- `script/` — Utility scripts (build helpers, seeds, migrations, image migration helpers).
- `attached_assets/`, `public/` — Static assets, uploads, service worker.
- `drizzle.config.ts` — Drizzle ORM configuration and migration settings.
- `package.json` (root) — scripts and dependencies for the whole project.

## Important files and their roles

- `package.json` — npm scripts you'll use (see Commands below).
- `server/index.ts` — backend entry point (starts Express, configures middleware and routes).
- `server/routes.ts` — route definitions and API endpoints.
- `server/db.ts` — Postgres connection and Drizzle ORM setup.
- `shared/schema.ts` & `shared/models/` — database schema and models.
- `script/seedAdmin.ts` — script to create an admin user.
- `client/src/` — React app: components (e.g., `EventCard.tsx`, `BookingModal.tsx`), hooks (`use-events`, `use-auth`), pages (`Home`, `EventDetails`, `Dashboard`).
- `client/src/components/ObjectUploader.tsx` — file upload UI, integrates with object storage.

## Environment variables

Place sensitive and environment-specific variables in `.env` (not committed). Key variables used by the project:

- `DATABASE_URL` — Postgres connection string, e.g. `postgresql://user:pass@host:5432/dbname`.
- `PORT` — port the backend listens on (default 5000).
- `NODE_ENV` — `development` or `production` (affects logging, error reporting).
- `SESSION_SECRET` — secret key for signing session cookies.

There may be additional variables required for object storage (Google Cloud Storage credentials) or OAuth providers. Check `server/storage.ts` and `object_storage/` for details.

## Development setup (local)

Prerequisites:

- Node.js (>= 18 recommended)
- PostgreSQL instance accessible from your machine
- (Optional) Google Cloud Storage or other object storage credentials if testing uploads

Steps:

1. Install dependencies (run in project root):

```bash
npm install
```

2. Ensure a Postgres database exists and update `DATABASE_URL` in `.env`.

3. Run the development server (backend):

```bash
npm run dev
```

This runs `cross-env NODE_ENV=development tsx server/index.ts`. The backend listens on the port configured by `PORT` (default 5000). In development the frontend is typically served by Vite on its own port (e.g., 5173). If the backend is configured to serve the client build in dev, follow server logs for the exact URL.

4. Seed an admin user (optional):

```bash
npm run seed:admin
```

5. Apply DB schema/migrations (if using Drizzle migrations):

```bash
npm run db:push
```

## Build & Production

1. Create a production build using the project's build script:

```bash
npm run build
```

2. Start the production server (after building):

```bash
npm run start
```

This expects compiled artifacts in `dist/` (see `script/build.ts`). Ensure `NODE_ENV=production` and production environment variables are set.

## Deployment (Render + Neon)

1. Free Postgres on Neon (neon.tech), copy the connection string into `DATABASE_URL`.
2. Create the schema and seed the data, run against the *production* URL:

```bash
DATABASE_URL=<neon-url> npm run db:push
DATABASE_URL=<neon-url> npm run seed:admin
DATABASE_URL=<neon-url> npm run seed:events
```

3. Push this repo to GitHub, then on render.com: **New → Blueprint → Add from repo** (uses `render.yaml`).
4. In the service EnvVars: set `DATABASE_URL` (Neon) and `UPLOAD_DIR=/data/uploads` (already in `render.yaml`). `SESSION_SECRET` is auto-generated.
5. A 1 GB persistent disk is mounted at `/data` so user uploads survive redeploys. Seeded sample images are committed in `attached_assets/uploads` and served as a fallback.

## Common commands (from `package.json`)

- `npm run dev` — start server in development (uses `tsx` to run TypeScript directly).
- `npm run build` — run `script/build.ts` to create production artifacts.
- `npm run start` — start the production server (node `dist/index.cjs`).
- `npm run seed:admin` — seed an admin account into the database.
- `npm run check` — run `tsc` to typecheck the codebase.
- `npm run db:push` — run `drizzle-kit push` to apply Drizzle migrations.

## How the workflow flows (high level)

1. Developer runs `npm run dev` to start the backend and (separately) runs the Vite dev server for frontend development.
2. The frontend calls backend APIs (`server/routes.ts`) to fetch and mutate data.
3. Backend uses `shared/schema.ts` and Drizzle to read/write to PostgreSQL.
4. File uploads from the client use the `ObjectUploader` component; the server handles multipart uploads and stores files via the `object_storage` module (e.g., GCS).
5. Sessions are stored in Postgres (via `connect-pg-simple` or `memorystore`) and signed with `SESSION_SECRET`.

