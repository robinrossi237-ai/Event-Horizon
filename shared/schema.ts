import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  organizerId: text("organizer_id").notNull(), // References users.id
  isPromoted: boolean("is_promoted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(), // VIP, Regular, etc.
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull(),
  available: integer("available").notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References users.id
  eventId: integer("event_id").notNull(),
  status: text("status").notNull().default("pending_payment"), // pending_payment, pending_approval, approved, rejected
  paymentProofUrl: text("payment_proof_url"),
  totalAmount: numeric("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  mobileMoneyNumber: text("mobile_money_number").notNull().default("+237 677420606"),
  orangeMoneyNumber: text("orange_money_number").notNull().default("659106128"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookingItems = pgTable("booking_items", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  ticketId: integer("ticket_id").notNull(),
  quantity: integer("quantity").notNull(),
});

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  tickets: many(tickets),
  bookings: many(bookings),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
  items: many(bookingItems),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  ticket: one(tickets, {
    fields: [bookingItems.ticketId],
    references: [tickets.id],
  }),
}));

// Schemas
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, isPromoted: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, available: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, status: true, totalAmount: true });

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Booking = typeof bookings.$inferSelect;
export type BookingItem = typeof bookingItems.$inferSelect;
export type PaymentSettings = typeof paymentSettings.$inferSelect;

export type CreateEventRequest = InsertEvent & { tickets: InsertTicket[] };
export type CreateBookingRequest = {
  eventId: number;
  items: { ticketId: number; quantity: number }[];
  paymentProofUrl: string;
};

export type UpdatePaymentSettingsRequest = {
  mobileMoneyNumber: string;
  orangeMoneyNumber: string;
};
