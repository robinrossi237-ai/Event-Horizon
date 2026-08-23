import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./object_storage/routes";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup auth and object storage routes
  setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // Events
  app.get(api.events.list.path, async (req, res) => {
    try {
      const search = (req.query.search as string) || undefined;
      const category = (req.query.category as string) || undefined;
      const events = await storage.getEvents(search, category);
      res.json(events);
    } catch (err) {
      console.error("GET /api/events error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.events.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const ev = await storage.getEvent(id);
      if (!ev) return res.status(404).json({ message: "Event not found" });
      res.json(ev);
    } catch (err) {
      console.error("GET /api/events/:id error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.events.create.path, isAuthenticated, async (req: any, res) => {
    try {
      // Accept ISO date strings from the client by coercing to Date
      if (req.body && typeof req.body.date === "string") {
        // Convert ISO string to Date object so Zod's date check passes
        req.body.date = new Date(req.body.date);
      }
      const input = api.events.create.input.parse(req.body);
      const organizerId = req.user?.claims?.sub ?? req.user?.id ?? "unknown";
      const created = await storage.createEvent({
        title: input.title,
        description: input.description,
        date: input.date as any,
        location: input.location,
        category: input.category,
        imageUrl: input.imageUrl,
        organizerId,
      } as any, input.tickets || []);
      res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/events error:", err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const body = req.body;
      // Accept ISO date strings from the client by coercing to Date (same as POST)
      if (body && typeof body.date === "string") {
        body.date = new Date(body.date);
      }
      // Debug: log incoming date value/type to avoid timestamp mapping errors
      try {
        console.log("[debug] PUT /api/events body.date type:", typeof body.date, body.date);
      } catch (e) {}
      const updated = await storage.updateEvent(id, body as any, body.tickets as any[] | undefined);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (err) {
      console.error("PUT /api/events/:id error:", (err as any)?.stack || err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.events.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const sub = (req.user as any).claims?.sub ?? (req.user as any).id;
      const user = await storage.getUser(sub);
      if (!user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
      const deleted = await storage.deleteEvent(id);
      if (!deleted) return res.status(404).json({ message: "Event not found" });
      res.json({ message: "Event deleted" });
    } catch (err) {
      console.error("DELETE /api/events/:id error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bookings
  app.post(api.bookings.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const userId = (req.user as any).claims?.sub ?? (req.user as any).id;

      // Calculate total amount (simplified)
      let total = 0;
      const event = await storage.getEvent(input.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      for (const item of input.items) {
        const ticket = event.tickets.find((t: any) => t.id === item.ticketId);
        if (ticket) total += Number(ticket.price) * item.quantity;
      }

      const booking = await storage.createBooking(userId, input, total);
      res.status(201).json(booking);
    } catch (err) {
      console.error("POST /api/bookings error:", err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).claims?.sub ?? (req.user as any).id;
    const bookings = await storage.getBookingsByUser(userId);
    res.json(bookings);
  });

  app.get(api.paymentSettings.get.path, async (_req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (err) {
      console.error("GET /api/payment-settings error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.bookings.approve.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.updateBookingStatus(id, "approved");
      res.json(booking);
    } catch (err) {
      console.error("POST approve error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.bookings.reject.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.updateBookingStatus(id, "rejected");
      res.json(booking);
    } catch (err) {
      console.error("POST reject error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin helpers
  app.get("/api/admin/bookings", isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).claims?.sub ?? (req.user as any).id;
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    const bookings = await storage.getAllBookings();
    res.json(bookings);
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const sub = (req.user as any).claims?.sub ?? (req.user as any).id;
      const user = await storage.getUser(sub);
      if (!user?.isAdmin) return res.status(403).json({ message: "Unauthorized" });
      const allUsers = await storage.getAllUsers();
      const safe = allUsers.map((u: any) => {
        const { passwordHash, ...rest } = u as any;
        return rest;
      });
      res.json(safe);
    } catch (error) {
      console.error("[admin] Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/events", isAuthenticated, async (req: any, res) => {
    try {
      const sub = (req.user as any).claims?.sub ?? (req.user as any).id;
      const user = await storage.getUser(sub);
      if (!user?.isAdmin) return res.status(403).json({ message: "Unauthorized" });
      const allEvents = await storage.getEvents();
      res.json(allEvents);
    } catch (error) {
      console.error("[admin] Error fetching events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.admin.paymentSettings.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const sub = (req.user as any).claims?.sub ?? (req.user as any).id;
      const user = await storage.getUser(sub);
      if (!user?.isAdmin) return res.status(403).json({ message: "Unauthorized" });
      const input = api.admin.paymentSettings.update.input.parse(req.body);
      const updated = await storage.updatePaymentSettings(input);
      res.json(updated);
    } catch (error) {
      console.error("[admin] Error updating payment settings:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed helper: promotes first user to admin and creates sample events if none exist
  await seed();

  return httpServer;
}

async function seed() {
  const existing = await storage.getEvents();

  // Promote first user to admin for demo convenience
  try {
    const allUsers = await db.select().from(users);
    if (allUsers.length > 0) {
      const firstUser = allUsers[0] as any;
      if (!firstUser.isAdmin) {
        await db.update(users).set({ isAdmin: true } as any).where(eq(users.id, firstUser.id));
        console.log(`User ${firstUser.email} promoted to admin for demo.`);
      }
    }
  } catch (err) {
    console.error("Seeding users error:", err);
  }

  if (existing.length === 0) {
    try {
      await storage.createEvent({
        title: "Summer Music Festival",
        description: "The biggest music festival of the year featuring top artists.",
        date: new Date("2025-07-15T18:00:00Z") as any,
        location: "Central Park, NY",
        category: "Music",
        imageUrl: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        organizerId: "seed-organizer",
      }, [
        { name: "General Admission", price: "50", quantity: 1000, eventId: 0 },
        { name: "VIP", price: "150", quantity: 200, eventId: 0 }
      ]);
    } catch (err) {
      console.error("Seed events error:", err);
    }
  }
}
