import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { members, bookings, type Member, type InsertMember, type Booking, type InsertBooking } from "@shared/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

// Init tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    business_name TEXT,
    vehicle_type TEXT,
    license_number TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    sent_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_type TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    estimated_price TEXT,
    created_at TEXT NOT NULL
  );
`);

export interface IStorage {
  // Members
  createMember(data: InsertMember): Member;
  getMembers(): Member[];
  getMembersByRole(role: string): Member[];

  // Bookings
  createBooking(data: InsertBooking): Booking;
  getBookings(): Booking[];
  getBookingById(id: number): Booking | undefined;
  updateBookingStatus(id: number, status: string): Booking | undefined;

  // Settings
  getSetting(key: string): string | null;
  setSetting(key: string, value: string): void;
  getAllSettings(): Record<string, string>;

  // Messages
  getMessages(bookingId: number): { id: number; bookingId: number; sender: string; text: string; sentAt: string }[];
  sendMessage(bookingId: number, sender: string, text: string): { id: number; bookingId: number; sender: string; text: string; sentAt: string };
}

export const storage: IStorage = {
  createMember(data) {
    return db.insert(members).values(data).returning().get();
  },
  getMembers() {
    return db.select().from(members).all();
  },
  getMembersByRole(role) {
    return db.select().from(members).where(eq(members.role, role)).all();
  },
  createBooking(data) {
    return db.insert(bookings).values(data).returning().get();
  },
  getBookings() {
    return db.select().from(bookings).all();
  },
  getBookingById(id) {
    return db.select().from(bookings).where(eq(bookings.id, id)).get();
  },
  updateBookingStatus(id, status) {
    return db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning().get();
  },
  getSetting(key) {
    const row = sqlite.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
    return row ? row.value : null;
  },
  setSetting(key, value) {
    sqlite.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  },
  getAllSettings() {
    const rows = sqlite.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },
  getMessages(bookingId) {
    const rows = sqlite.prepare("SELECT id, booking_id, sender, text, sent_at FROM messages WHERE booking_id = ? ORDER BY id ASC").all(bookingId) as any[];
    return rows.map(r => ({ id: r.id, bookingId: r.booking_id, sender: r.sender, text: r.text, sentAt: r.sent_at }));
  },
  sendMessage(bookingId, sender, text) {
    const sentAt = new Date().toISOString();
    const result = sqlite.prepare("INSERT INTO messages (booking_id, sender, text, sent_at) VALUES (?, ?, ?, ?)").run(bookingId, sender, text, sentAt);
    return { id: result.lastInsertRowid as number, bookingId, sender, text, sentAt };
  },
};
