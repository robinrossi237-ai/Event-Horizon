# Event Horizon

A full-stack event management web app with React frontend and Express/Node.js backend using PostgreSQL.

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Express.js + TypeScript
- Database: PostgreSQL

## Prerequisites
- Node.js (v18+)
- PostgreSQL running locally
- npm

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.sample` to `.env` and fill in your values:
```bash
copy .env.sample .env
```
Set your `DATABASE_URL`, `SESSION_SECRET`, etc.

### 3. Push the database schema
```bash
npm run db:push
```

### 4. (Optional) Seed admin user
```bash
npm run seed:admin
```

### 5. Start the development server
```bash
npm run dev
```

The app runs on **http://localhost:5000** (frontend + backend served together).

## Production Build
```bash
npm run build
npm run start
```
