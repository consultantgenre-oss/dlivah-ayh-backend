import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Founder positions: FOC | DOF | BP
export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(), // "FOC" | "DOF" | "BP"
  tier: text("tier"),           // BP only: "Small" | "Mid" | "Large"
  businessName: text("business_name"), // BP only
  vehicleType: text("vehicle_type"),   // DOF only
  licenseNumber: text("license_number"), // DOF only
  membershipPrice: text("membership_price").notNull().default("99.99"),
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending" | "paid"
  paymentRef: text("payment_ref"), // e.g. CashApp transaction ID they send
  status: text("status").notNull().default("pending_payment"), // "pending_payment" | "active"
  joinedAt: text("joined_at").notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Bookings
export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingType: text("booking_type").notNull(), // "ride" | "move" | "delivery"
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  estimatedPrice: text("estimated_price"),
  createdAt: text("created_at").notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
