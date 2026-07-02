import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Driver accounts
export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  licenseNumber: text("license_number").notNull(),
  pin: text("pin").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "active"
  joinedAt: text("joined_at").notNull(),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

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
  referredBy: text("referred_by"), // member ID of the person who referred them
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
  createdAt: text("created_at").notNull()
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Driver payout ledger — one row per completed job
export const earningsLedger = sqliteTable("earnings_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull(),
  customerName: text("customer_name").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  bookingType: text("booking_type").notNull(),
  grossFare: text("gross_fare").notNull(),           // e.g. "18.50" — estimated price from booking
  maintenanceFee: text("maintenance_fee").notNull(), // $1.59 infrastructure maintenance
  acquisitionFee: text("acquisition_fee").notNull(), // $1.40 driver acquisition / platform access
  platformFee: text("platform_fee").notNull(),       // $2.99 total (maintenance + acquisition)
  driverPayout: text("driver_payout").notNull(),     // gross - platform fee
  payoutStatus: text("payout_status").notNull().default("pending"), // "pending" | "paid" | "zapier_triggered"
  completedAt: text("completed_at").notNull(),
  webhookSentAt: text("webhook_sent_at"),       // ISO timestamp if Zapier webhook was fired
  stripeTransferId: text("stripe_transfer_id"), // populated if Stripe Connect transfer created
});

export const insertLedgerSchema = createInsertSchema(earningsLedger).omit({ id: true });
export type InsertLedger = z.infer<typeof insertLedgerSchema>;
export type LedgerEntry = typeof earningsLedger.$inferSelect;
