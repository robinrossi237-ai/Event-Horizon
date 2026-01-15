# Event Ticketing System

## Overview

This is a full-stack event ticketing platform that allows event organizers to create and manage events, and attendees to browse, book, and receive tickets. The system supports manual payment verification through payment proof uploads, QR code ticket generation, and role-based access control with admin and regular user roles.

The application follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database, all managed through a unified TypeScript codebase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables for theming
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints with Zod schema validation
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Replit Auth integration using OpenID Connect

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push` command
- **Key Entities**: Users, Events, Tickets, Bookings, BookingItems, Sessions

### Shared Code Pattern
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Database schema and type definitions
- `routes.ts`: API route definitions with Zod schemas for type-safe API contracts
- `models/auth.ts`: User and session table definitions

### File Upload System
- **Storage**: Replit Object Storage (Google Cloud Storage integration)
- **Upload Flow**: Presigned URL pattern - client requests URL from backend, then uploads directly to storage
- **Component**: `ObjectUploader` component using Uppy library for file management

### Authentication Flow
- Replit Auth via OpenID Connect
- Session-based authentication with PostgreSQL session store
- User data synced to local database on login
- Admin role stored in users table (`isAdmin` boolean)

## External Dependencies

### Core Services
- **Database**: PostgreSQL (provisioned via Replit, connection via DATABASE_URL)
- **Object Storage**: Replit Object Storage / Google Cloud Storage for file uploads
- **Authentication**: Replit Auth (OpenID Connect provider)

### Key NPM Packages
- **Frontend**: React, Wouter, TanStack Query, shadcn/ui, Radix UI, Tailwind CSS, date-fns, Uppy
- **Backend**: Express, Drizzle ORM, Passport, express-session, connect-pg-simple, Zod
- **Shared**: TypeScript, Zod for validation

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: Replit OIDC issuer (defaults to https://replit.com/oidc)
- `REPL_ID`: Replit environment identifier

### Build & Development
- Development: `npm run dev` (tsx for TypeScript execution)
- Production Build: `npm run build` (Vite for frontend, esbuild for backend)
- Database Sync: `npm run db:push` (Drizzle Kit schema push)