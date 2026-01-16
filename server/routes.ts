import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const events = await storage.getEvents(search, category);
    res.json(events);
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.post(api.events.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Only admins can create events" });
      }

      const bodySchema = api.events.create.input.extend({
        date: z.coerce.date(),
      });
      const input = bodySchema.parse(req.body);
      // Ensure organizerId is set to current user
      const eventData = { ...input, organizerId: (req.user as any).claims.sub };
      const event = await storage.createEvent(eventData, input.tickets);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Bookings
  app.post(api.bookings.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      // Calculate total amount (simplified)
      // In a real app, fetch ticket prices from DB again to verify
      let total = 0;
      const event = await storage.getEvent(input.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });
      
      for (const item of input.items) {
        const ticket = event.tickets.find(t => t.id === item.ticketId);
        if (ticket) {
          total += Number(ticket.price) * item.quantity;
        }
      }

      const booking = await storage.createBooking(userId, input, total);
      res.status(201).json(booking);
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const bookings = await storage.getBookingsByUser(userId);
    res.json(bookings);
  });
  
  // Admin Routes (Simplified: any authenticated user can access for this demo, 
  // or checks specific email/ID if needed. For now, assume open admin for MVP/demo)
  // In production, add isAdmin middleware.
  
  app.get("/api/admin/bookings", isAuthenticated, async (req, res) => {
     const userId = (req.user as any).claims.sub;
     const user = await storage.getUser(userId);
     if (!user?.isAdmin) {
       return res.status(403).json({ message: "Admin access required" });
     }
     // Return all bookings for admin
     const bookings = await storage.getAllBookings();
     res.json(bookings);
  });

  app.post(api.bookings.approve.path, isAuthenticated, async (req, res) => {
    const booking = await storage.updateBookingStatus(Number(req.params.id), "approved");
    res.json(booking);
  });

  app.post(api.bookings.reject.path, isAuthenticated, async (req, res) => {
    const booking = await storage.updateBookingStatus(Number(req.params.id), "rejected");
    res.json(booking);
  });

  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.get("/api/admin/events", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });
    const allEvents = await storage.getEvents();
    res.json(allEvents);
  });
  
  // Seed data
  await seed();

  return httpServer;
}

async function seed() {
  const existing = await storage.getEvents();
  
  // Make the first logged-in user an admin if they exist
  // This is a helper for the user to get admin access easily in the demo
  const allUsers = await db.select().from(users);
  if (allUsers.length > 0) {
    const firstUser = allUsers[0] as any;
    if (!firstUser.isAdmin) {
      await db.update(users).set({ isAdmin: true } as any).where(eq(users.id, firstUser.id));
      console.log(`User ${firstUser.email} promoted to admin for demo.`);
    }
  }

  if (existing.length === 0) {
    // Create a dummy user ID for seeding (since we don't have a real user yet)
    // In reality, events should be created by real users.
    // We'll just use a placeholder string that matches no real user, 
    // but the app should handle "unknown organizer" gracefully or we just insert it.
    
    // Note: Since organizer_id references users.id, we might need a user first.
    // However, Replit Auth users are inserted on login.
    // We can insert a dummy user for seeding if needed, or just let the first user create events.
    // Let's create one seed event.
    
    // Actually, we can't easily seed events without a valid user ID if there's a foreign key constraint.
    // The schema defined `organizerId: text("organizer_id").notNull()`.
    // It says `// References users.id` in comment, but did I enforce it in Drizzle?
    // In `shared/schema.ts`: 
    // `organizer: one(users, { fields: [events.organizerId], references: [users.id] })`
    // This is a Drizzle relation, not a SQL constraint unless `references(...)` is on the column definition.
    // I didn't put `.references(() => users.id)` on the column, so it's a soft relation.
    // So we can seed safely.
    
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
    
     await storage.createEvent({
      title: "Tech Conference 2025",
      description: "Future of AI and Web Development.",
      date: new Date("2025-09-20T09:00:00Z") as any,
      location: "Convention Center, SF",
      category: "Technology",
      imageUrl: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      organizerId: "seed-organizer",
    }, [
      { name: "Early Bird", price: "299", quantity: 500, eventId: 0 },
      { name: "Standard", price: "499", quantity: 1000, eventId: 0 }
    ]);
  }
}
