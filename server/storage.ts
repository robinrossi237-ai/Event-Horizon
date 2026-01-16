import { db } from "./db";
import {
  events,
  tickets,
  bookings,
  bookingItems,
  users,
  type Event,
  type InsertEvent,
  type InsertTicket,
  type Booking,
  type CreateBookingRequest,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Events
  getEvents(search?: string, category?: string): Promise<(Event & { tickets: any[] })[]>;
  getEvent(id: number): Promise<(Event & { tickets: any[] }) | undefined>;
  createEvent(event: InsertEvent, ticketTypes: InsertTicket[]): Promise<Event>;
  
  // Bookings
  createBooking(userId: string, request: CreateBookingRequest, totalAmount: number): Promise<Booking>;
  getBookingsByUser(userId: string): Promise<(Booking & { event: Event })[]>;
  getBooking(id: number): Promise<(Booking & { event: Event, items: any[], user: any }) | undefined>;
  getAllBookings(): Promise<(Booking & { event: Event, user: any })[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  getAllUsers(): Promise<any[]>;
  getUser(id: string): Promise<any>;
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
      with: { event: true },
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
    const [updated] = await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(users).orderBy(desc(users.id));
  }
}

export const storage = new DatabaseStorage();
