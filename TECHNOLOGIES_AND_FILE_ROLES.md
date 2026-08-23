# Event-Horizon: Technologies, Frontend/Backend, and File Roles

## 1) Technologies used in this project

### Frontend
- React 18 + TypeScript (`client/src`)
- Vite 7 (`vite.config.ts`) for dev server and frontend build
- Wouter for client-side routing (`client/src/App.tsx`)
- TanStack React Query for server-state fetching/caching (`client/src/lib/queryClient.ts`)
- Tailwind CSS + PostCSS + Autoprefixer (`tailwind.config.ts`, `postcss.config.js`, `client/src/index.css`)
- shadcn/ui components built on Radix UI primitives (`client/src/components/ui/*.tsx`)
- Lucide React icons, `date-fns` formatting, `qrcode.react` for ticket QR codes
- Service worker for offline image caching (`client/public/sw.js`)

### Backend
- Node.js + Express 4 + TypeScript (`server/*.ts`)
- Session auth via `express-session` + Passport (`server/replit_integrations/auth/*`)
- Local email/password auth flow (signup/login endpoints in `server/replit_integrations/auth/routes.ts`)
- Multer disk upload pipeline for images and payment proofs (`server/object_storage/routes.ts`)

### Database and data layer
- PostgreSQL (Docker compose service in `docker-compose.yml`)
- Drizzle ORM + `pg` driver (`server/db.ts`, `shared/schema.ts`)
- Zod and drizzle-zod for runtime validation and typed schemas (`shared/routes.ts`, `shared/schema.ts`)

### Build and developer tooling
- `tsx` for running TS directly in development (`npm run dev`)
- `esbuild` + Vite in production build script (`script/build.ts`)
- Drizzle Kit for DB push/migrations (`drizzle.config.ts`)

## 2) Frontend vs Backend used here

### Frontend (`client/`)
Responsibilities:
- Render pages (home, catalogue, event details, booking dashboard, admin dashboard, auth)
- Call REST endpoints under `/api/*`
- Handle forms, UI state, filters, table views, and toasts
- Upload files (event images and payment proof) and display returned object URLs
- Render downloadable ticket page with QR code

### Backend (`server/`)
Responsibilities:
- Expose API endpoints for events, bookings, admin data, auth, and uploads
- Validate payloads using shared API contracts and Zod
- Manage sessions and access control (authenticated + admin-only operations)
- Persist events/tickets/bookings/users in PostgreSQL through Drizzle
- Serve uploaded objects (`/objects/*`) and static frontend in production

### Shared contract (`shared/`)
Responsibilities:
- Define DB schema/tables/relations and TS types
- Define API contracts (paths, methods, zod input/response parsers) used by both server and client

## 3) File-by-file role map

## Root files
- `package.json`: scripts, dependencies, devDependencies.
- `package-lock.json`: exact dependency lockfile.
- `README.md`: project usage and architecture notes.
- `tsconfig.json`: TypeScript compiler options and path aliases.
- `vite.config.ts`: Vite config, aliases, root (`client`), and build output (`dist/public`).
- `tailwind.config.ts`: Tailwind theme tokens, plugins, and content paths.
- `postcss.config.js`: PostCSS pipeline (tailwindcss + autoprefixer).
- `drizzle.config.ts`: Drizzle Kit config for Postgres and shared schema file.
- `docker-compose.yml`: local Postgres service (`postgres:15`).
- `components.json`: shadcn/ui generation config and aliases.
- `event_horizon`: PostgreSQL custom-format dump/backup artifact (`PGDMP` header).

## Shared (`shared/`)
- `shared/schema.ts`: core tables (`events`, `tickets`, `bookings`, `booking_items`), relations, insert schemas, exported types.
- `shared/routes.ts`: API contract definitions (`api.events`, `api.bookings`, `api.admin`) and `buildUrl` helper.
- `shared/models/auth.ts`: auth/session DB models (`users`, `sessions`) and related types.

## Backend (`server/`)
- `server/index.ts`: main Express bootstrapping, middleware, logging, error handler, dev/prod serving mode.
- `server/routes.ts`: all major API route registrations and seed helper.
- `server/db.ts`: Postgres pool + Drizzle DB instance creation.
- `server/storage.ts`: data access layer for events/bookings/users (CRUD + booking approval transaction logic).
- `server/static.ts`: serves built frontend from `dist/public` in production.
- `server/vite.ts`: Vite middleware integration for development.

### Upload/object storage routes
- `server/object_storage/routes.ts`: local disk upload endpoints (`/api/uploads*`) and object serving endpoint (`/objects/:objectPath(*)`).

### Auth integration
- `server/replit_integrations/auth/index.ts`: auth exports.
- `server/replit_integrations/auth/replitAuth.ts`: Passport/session setup, auth guard, password hashing/verification helpers.
- `server/replit_integrations/auth/routes.ts`: `/api/auth/user`, `/api/signup`, `/api/local-login` endpoints.
- `server/replit_integrations/auth/storage.ts`: auth user storage adapter using Drizzle.

### Deprecated Replit object-storage stubs (kept for compatibility)
- `server/replit_integrations/object_storage/index.ts`: removed integration stub.
- `server/replit_integrations/object_storage/routes.ts`: deprecated routes stub.
- `server/replit_integrations/object_storage/objectStorage.ts`: removed object storage service stub.
- `server/replit_integrations/object_storage/objectAcl.ts`: ACL placeholder types/helpers.

## Scripts (`script/`)
- `script/build.ts`: production build script (build frontend via Vite + bundle server via esbuild).
- `script/seedAdmin.ts`: seeds an admin user with hashed password.
- `script/seed-and-migrate.ts`: seeds sample events/tickets and migrates remote image URLs to local object paths.
- `script/migrate-images.ts`: migrates existing event image URLs to local uploaded objects.

## Frontend app shell (`client/`)
- `client/index.html`: SPA HTML shell and font imports.
- `client/requirements.md`: informal package/feature notes.
- `client/public/sw.js`: service worker for image/offline cache strategy.
- `client/public/offline-image.png`: fallback offline image.
- `client/public/1769501469183-fire-force-season-3-3840x2160-21927.jpg`: app favicon/static image.

## Frontend source (`client/src/`)
- `client/src/main.tsx`: React bootstrap + service-worker registration.
- `client/src/App.tsx`: top-level providers and route switch.
- `client/src/index.css`: global styles, theme tokens, Tailwind layers.

### Pages
- `client/src/pages/Home.tsx`: landing page, search/filter, featured/upcoming event cards.
- `client/src/pages/Catalogue.tsx`: filter-heavy event catalogue view (search/category/price).
- `client/src/pages/EventDetails.tsx`: detailed event page + booking modal trigger/edit actions.
- `client/src/pages/Dashboard.tsx`: end-user booking dashboard and ticket download links.
- `client/src/pages/AdminDashboard.tsx`: admin tabs for pending approvals, history, users, events.
- `client/src/pages/CreateEvent.tsx`: admin create/edit event form with image upload.
- `client/src/pages/TicketView.tsx`: printable digital ticket page with QR code.
- `client/src/pages/auth.tsx`: login/signup UI and auth submission flow.
- `client/src/pages/not-found.tsx`: fallback 404 view.

### Hooks
- `client/src/hooks/use-auth.ts`: current-session user query + logout mutation.
- `client/src/hooks/use-bookings.ts`: bookings query + create/approve/reject mutations.
- `client/src/hooks/use-events.ts`: events query + single-event query + create/update/delete mutations.
- `client/src/hooks/use-upload.ts`: two-step presigned upload helper hook.
- `client/src/hooks/use-mobile.tsx`: mobile breakpoint hook.
- `client/src/hooks/use-toast.ts`: in-memory toast state manager.

### Frontend libs
- `client/src/lib/queryClient.ts`: shared React Query client config and request helpers.
- `client/src/lib/auth-utils.ts`: unauthorized helper/redirect utility.
- `client/src/lib/utils.ts`: `cn()` class name merge helper (`clsx` + `tailwind-merge`).

### Feature components
- `client/src/components/Navbar.tsx`: top navigation with auth-aware actions/menu.
- `client/src/components/EventCard.tsx`: event listing card UI with category/price/date badges.
- `client/src/components/BookingModal.tsx`: ticket quantity + payment proof upload + booking submit flow.
- `client/src/components/ObjectUploader.tsx`: generic Uppy-based upload button component.
- `client/src/components/layout-shell.tsx`: centered layout shell used by auth page.

### UI primitive components (`client/src/components/ui/`)
- `accordion.tsx`: accordion primitive.
- `alert.tsx`: inline alert component.
- `alert-dialog.tsx`: confirm/cancel dialog.
- `aspect-ratio.tsx`: ratio-locked container.
- `avatar.tsx`: avatar/image fallback.
- `badge.tsx`: badge/pill labels.
- `breadcrumb.tsx`: breadcrumb navigation.
- `button.tsx`: shared button variants.
- `calendar.tsx`: date picker/calendar.
- `card.tsx`: card container primitives.
- `carousel.tsx`: carousel wrapper.
- `chart.tsx`: chart UI wrapper.
- `checkbox.tsx`: checkbox input.
- `collapsible.tsx`: collapsible section primitive.
- `command.tsx`: command menu/palette primitive.
- `context-menu.tsx`: right-click context menu.
- `dialog.tsx`: modal dialog primitive.
- `drawer.tsx`: slide-up drawer component.
- `dropdown-menu.tsx`: dropdown menu primitives.
- `form.tsx`: form field helpers/wrappers.
- `hover-card.tsx`: hover preview card.
- `input.tsx`: text input component.
- `input-otp.tsx`: OTP/pin segmented input.
- `label.tsx`: form label.
- `menubar.tsx`: menubar navigation primitive.
- `navigation-menu.tsx`: nav menu primitives.
- `pagination.tsx`: pagination controls.
- `popover.tsx`: popover primitive.
- `progress.tsx`: progress bar.
- `radio-group.tsx`: radio group inputs.
- `resizable.tsx`: resizable panel primitives.
- `scroll-area.tsx`: styled scroll area.
- `select.tsx`: select/dropdown input.
- `separator.tsx`: visual separator line.
- `sheet.tsx`: side sheet panel.
- `sidebar.tsx`: sidebar layout primitives.
- `skeleton.tsx`: loading skeleton placeholder.
- `slider.tsx`: slider/range input.
- `switch.tsx`: on/off switch.
- `table.tsx`: table primitives.
- `tabs.tsx`: tab primitives.
- `textarea.tsx`: textarea input.
- `toast.tsx`: toast primitive.
- `toaster.tsx`: toast container renderer.
- `toggle.tsx`: single toggle button.
- `toggle-group.tsx`: grouped toggles.
- `tooltip.tsx`: tooltip primitive.

## Attached assets and non-core artifacts (`attached_assets/`)
- `attached_assets/Pasted-classic-but-powerful-project-An-Event-Ticketing-System-_1768383326552.txt`: pasted project notes/requirements text.
- `attached_assets/auth_1768662793824.php`: unrelated Laravel auth routes snippet (reference artifact).
- `attached_assets/uploads/*`: timestamped uploaded image files used as event images/payment proofs and object-storage test data.

Current upload files present:
- `attached_assets/uploads/1768830254546-Screenshot_2026-01-15_114016.png`
- `attached_assets/uploads/1768830757151-Screenshot_2026-01-14_134220.png`
- `attached_assets/uploads/1768830981917-Screenshot_2026-01-15_184316.png`
- `attached_assets/uploads/1768831576678-Screenshot__224_.png`
- `attached_assets/uploads/1768832312383-Screenshot_2026-01-14_185143.png`
- `attached_assets/uploads/1768832457213-Screenshot_2026-01-14_134220.png`
- `attached_assets/uploads/1768833061189-Screenshot_2026-01-15_184316.png`
- `attached_assets/uploads/1768833201214-Screenshot_2026-01-15_184316.png`
- `attached_assets/uploads/1768833316154-Screenshot_2026-01-12_211748.png`
- `attached_assets/uploads/1768833983218-Screenshot_2026-01-12_211714.png`
- `attached_assets/uploads/1768834301547-Screenshot_2026-01-14_134220.png`
- `attached_assets/uploads/1768837265620-Screenshot_2026-01-12_211748.png`
- `attached_assets/uploads/1768838075754-Screenshot_2026-01-15_055115.png`
- `attached_assets/uploads/1768886345499-Screenshot_2025-12-02_043735.png`
- `attached_assets/uploads/1768992539690-Screenshot_2026-01-21_064009.png`
- `attached_assets/uploads/1768992768431-Screenshot__637_.png`
- `attached_assets/uploads/1768993254711-Screenshot_2026-01-15_054640.png`
- `attached_assets/uploads/1768993478689-Screenshot_2026-01-15_054640.png`
- `attached_assets/uploads/1768993643451-Screenshot_2026-01-15_054640.png`
- `attached_assets/uploads/1768996077859-Screenshot_2026-01-16_154502.png`
- `attached_assets/uploads/1769485950453-dinner-special-2.jpg`
- `attached_assets/uploads/1769501469183-fire-force-season-3-3840x2160-21927.jpg`
- `attached_assets/uploads/1769502932986-Naruto-Shippuden-Ultimate-Ninja-Storm-4-Road-to-Boruto.jpg`
- `attached_assets/uploads/1769507655131-attack-on-titan-3840x2160-21064.jpg`
- `attached_assets/uploads/1769508091034-Naruto-Shippuden-Ultimate-Ninja-Storm-4-Road-to-Boruto.jpg`
- `attached_assets/uploads/1770382307030-fire-force-season-3-3840x2160-21927.jpg`

## 4) Quick architecture flow
1. Frontend calls `/api/*` endpoints using React Query hooks.
2. Backend routes validate input with shared Zod schemas.
3. Storage layer performs DB operations through Drizzle and PostgreSQL.
4. Upload endpoints store files to `attached_assets/uploads` and expose them under `/objects/uploads/*`.
5. Auth/session middleware protects private endpoints and admin operations.
