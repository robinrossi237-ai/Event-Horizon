import passport from "passport";
import type { Express, RequestHandler } from "express";
import { authStorage, UpsertUser } from "./storage";

// Setup authentication
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (_req, res) => res.redirect("/auth"));
  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
}

// Auth guard middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

// Create a new user with hashed password
export async function createUser(email: string, password: string, name?: string) {
  const existing = await authStorage.getUserByEmail(email);
  if (existing) throw new Error("User already exists");

  const bcryptMod = await import("bcryptjs");
  const bcrypt = (bcryptMod as any).default ?? bcryptMod;
  const passwordHash = bcrypt.hashSync ? bcrypt.hashSync(password, 12) : await bcrypt.hash(password, 12);

  const user: UpsertUser = {
    email,
    passwordHash,
    firstName: name ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isAdmin: false,
  };

  return authStorage.upsertUser(user);
}

// Verify password by email
export async function verifyUser(email: string, password: string) {
  const user = await authStorage.getUserByEmail(email);
  if (!user) return null;

  const bcryptMod = await import("bcryptjs");
  const bcrypt = (bcryptMod as any).default ?? bcryptMod;
  const ok = bcrypt.compareSync ? bcrypt.compareSync(password, user.passwordHash as string) : await bcrypt.compare(password, user.passwordHash as string);
  return ok ? user : null;
}
