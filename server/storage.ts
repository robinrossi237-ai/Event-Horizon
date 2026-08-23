import { db } from "./db";
import {
  events,
  tickets,
  bookings,
  paymentSettings,
  bookingItems,
  users,
  type Event,
  type InsertEvent,
  type InsertTicket,
  type Booking,
  type PaymentSettings,
  type CreateBookingRequest,
  type UpdatePaymentSettingsRequest,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Events
  getEvents(search?: string, category?: string): Promise<(Event & { tickets: any[] })[]>;
  getEvent(id: number): Promise<(Event & { tickets: any[] }) | undefined>;
  createEvent(event: InsertEvent, ticketTypes: InsertTicket[]): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>, ticketTypes?: InsertTicket[]): Promise<Event | null>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Bookings
  createBooking(userId: string, request: CreateBookingRequest, totalAmount: number): Promise<Booking>;
  getBookingsByUser(userId: string): Promise<(Booking & { event: Event })[]>;
  getBooking(id: number): Promise<(Booking & { event: Event, items: any[], user: any }) | undefined>;
  getAllBookings(): Promise<(Booking & { event: Event, user: any })[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  getAllUsers(): Promise<any[]>;
  getUser(id: string): Promise<any>;
  getPaymentSettings(): Promise<PaymentSettings>;
  updatePaymentSettings(settings: UpdatePaymentSettingsRequest): Promise<PaymentSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<any> {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getEvents(search?: string, category?: string): Promise<(Event & { tickets: any[] })[]> {
    // In a real app we'd filter, but for now just return all
    const allEvents = await db.query.events.findMany({
      with: { tickets: true },
      orderBy: [desc(events.date)],
    });
    
    // Simple in-memory filtering for MVP
    return allEvents.filter(e => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && e.category !== category) return false;
      return true;
    });
  }

  async getEvent(id: number): Promise<(Event & { tickets: any[] }) | undefined> {
    return await db.query.events.findFirst({
      where: eq(events.id, id),
      with: { tickets: true },
    });
  }

  async createEvent(event: InsertEvent, ticketTypes: InsertTicket[]): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    
    for (const t of ticketTypes) {
      await db.insert(tickets).values({
        ...t,
        eventId: newEvent.id,
        available: t.quantity,
      });
    }
    
    return newEvent;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>, ticketTypes?: InsertTicket[]): Promise<Event | null> {
    const [existing] = await db.select().from(events).where(eq(events.id, id));
    if (!existing) return null;
    // Ensure date is a JS Date before passing to the DB driver
    if (eventData && eventData.date) {
      try {
        const d = eventData.date;
        if (!(d instanceof Date)) {
          // Accept ISO strings or numeric timestamps
          const coerced = new Date(d as any);
          if (!Number.isNaN(coerced.getTime())) {
            eventData.date = coerced as any;
          }
        }
      } catch (e) {
        // leave as-is; DB driver will throw and we log elsewhere
      }
    }

    const [updated] = await db.update(events).set({
      title: eventData.title ?? existing.title,
      description: eventData.description ?? existing.description,
      date: eventData.date ?? existing.date,
      location: eventData.location ?? existing.location,
      category: eventData.category ?? existing.category,
      imageUrl: eventData.imageUrl ?? existing.imageUrl,
      updatedAt: new Date(),
    } as any).where(eq(events.id, id)).returning();

    if (ticketTypes) {
      // Remove existing tickets and insert new ones (simple approach)
      await db.delete(tickets).where(eq(tickets.eventId, id));
      for (const t of ticketTypes) {
        await db.insert(tickets).values({
          ...t,
          eventId: id,
          available: t.quantity,
        });
      }
    }

    return updated;
  }

  async createBooking(userId: string, request: CreateBookingRequest, totalAmount: number): Promise<Booking> {
    const [booking] = await db.insert(bookings).values({
      userId,
      eventId: request.eventId,
      paymentProofUrl: request.paymentProofUrl,
      totalAmount: totalAmount.toString(),
      status: "pending_approval", // Skip pending_payment since they uploaded proof
    }).returning();

    for (const item of request.items) {
      await db.insert(bookingItems).values({
        bookingId: booking.id,
        ticketId: item.ticketId,
        quantity: item.quantity,
      });
      
      // Update inventory (simplified, no transaction for MVP)
      // In production use transaction!
    }

    return booking;
  }

  async getBookingsByUser(userId: string): Promise<(Booking & { event: Event })[]> {
    return await db.query.bookings.findMany({
      where: eq(bookings.userId, userId),
      with: { event: true, items: { with: { ticket: true } } },
      orderBy: [desc(bookings.createdAt)],
    });
  }

  async getBooking(id: number): Promise<(Booking & { event: Event, items: any[], user: any }) | undefined> {
    return await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: { 
        event: true,
        items: { with: { ticket: true } },
        user: true
      },
    });
  }

  async getAllBookings(): Promise<(Booking & { event: Event, user: any })[]> {
    return await db.query.bookings.findMany({
      with: { event: true, user: true },
      orderBy: [desc(bookings.createdAt)],
    });
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    // If approving a booking, decrement ticket availability inside a transaction
    if (status === "approved") {
      return await db.transaction(async (tx) => {
        const [booking] = await tx.select().from(bookings).where(eq(bookings.id, id));
        if (!booking) throw new Error("Booking not found");

        const items = await tx.select().from(bookingItems).where(eq(bookingItems.bookingId, id));
        // Verify availability and decrement
        for (const item of items) {
          const [ticketRow] = await tx.select().from(tickets).where(eq(tickets.id, item.ticketId));
          if (!ticketRow) throw new Error("Ticket not found");
          if (ticketRow.available < item.quantity) {
            throw new Error(`Insufficient tickets for ${ticketRow.name}`);
          }
          await tx.update(tickets).set({ available: ticketRow.available - item.quantity }).where(eq(tickets.id, ticketRow.id));
        }

        const [updated] = await tx.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
        return updated;
      });
    }

    const [updated] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(events).where(eq(events.id, id));
      if (!existing) return false;

      // Delete booking items for bookings related to this event
      const bookingsForEvent = await tx.select().from(bookings).where(eq(bookings.eventId, id));
      for (const b of bookingsForEvent) {
        await tx.delete(bookingItems).where(eq(bookingItems.bookingId, b.id));
      }

      // Delete bookings for this event
      await tx.delete(bookings).where(eq(bookings.eventId, id));

      // Delete tickets
      await tx.delete(tickets).where(eq(tickets.eventId, id));

      // Finally delete the event
      await tx.delete(events).where(eq(events.id, id));

      return true;
    });
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(users).orderBy(desc(users.id));
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const existing = await db.query.paymentSettings.findFirst({
      orderBy: [desc(paymentSettings.id)],
    });
    if (existing) return existing;

    const [created] = await db.insert(paymentSettings).values({
      mobileMoneyNumber: "+237 677420606",
      orangeMoneyNumber: "659106128",
    }).returning();
    return created;
  }

  async updatePaymentSettings(settings: UpdatePaymentSettingsRequest): Promise<PaymentSettings> {
    const existing = await this.getPaymentSettings();
    const [updated] = await db
      .update(paymentSettings)
      .set({
        mobileMoneyNumber: settings.mobileMoneyNumber,
        orangeMoneyNumber: settings.orangeMoneyNumber,
        updatedAt: new Date(),
      })
      .where(eq(paymentSettings.id, existing.id))
      .returning();

    return updated;
  }
}

export const storage = new DatabaseStorage();
