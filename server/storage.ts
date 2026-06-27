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
    tier TEXT,
    business_name TEXT,
    vehicle_type TEXT,
    license_number TEXT,
    membership_price TEXT NOT NULL DEFAULT '99.99',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_ref TEXT,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    joined_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS driver_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    bio TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    updated_at TEXT
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

// Migrate existing members table columns if needed
try {
  sqlite.exec(`ALTER TABLE members ADD COLUMN tier TEXT`);
} catch {}
try {
  sqlite.exec(`ALTER TABLE members ADD COLUMN membership_price TEXT NOT NULL DEFAULT '99.99'`);
} catch {}
try {
  sqlite.exec(`ALTER TABLE members ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'`);
} catch {}
try {
  sqlite.exec(`ALTER TABLE members ADD COLUMN payment_ref TEXT`);
} catch {}
try {
  sqlite.exec(`ALTER TABLE members ADD COLUMN status TEXT NOT NULL DEFAULT 'pending_payment'`);
} catch {}

export interface IStorage {
  // Members
  createMember(data: InsertMember): Member;
  getMembers(): Member[];
  getMemberById(id: number): Member | undefined;
  getMembersByRole(role: string): Member[];
  getMembersPendingPayment(): Member[];
  confirmPayment(id: number, paymentRef?: string): Member | undefined;

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

  // Driver Profile
  getDriverProfile(): { name: string | null; bio: string | null; phone: string | null; email: string | null; photoUrl: string | null; updatedAt: string | null } | null;
  updateDriverProfile(data: { name?: string; bio?: string; phone?: string; email?: string; photoUrl?: string }): void;
}

export const storage: IStorage = {
  createMember(data) {
    return db.insert(members).values(data).returning().get();
  },
  getMembers() {
    return db.select().from(members).all();
  },
  getMemberById(id) {
    return db.select().from(members).where(eq(members.id, id)).get();
  },
  getMembersByRole(role) {
    return db.select().from(members).where(eq(members.role, role)).all();
  },
  getMembersPendingPayment() {
    return db.select().from(members).where(eq(members.paymentStatus, "pending")).all();
  },
  confirmPayment(id, paymentRef) {
    return db.update(members)
      .set({ paymentStatus: "paid", status: "active", paymentRef: paymentRef ?? null })
      .where(eq(members.id, id))
      .returning().get();
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
  getDriverProfile() {
    const row = sqlite.prepare("SELECT name, bio, phone, email, photo_url, updated_at FROM driver_profile WHERE id = 1").get() as any;
    if (!row) return null;
    return { name: row.name, bio: row.bio, phone: row.phone, email: row.email, photoUrl: row.photo_url, updatedAt: row.updated_at };
  },
  updateDriverProfile(data) {
    const updatedAt = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO driver_profile (id, name, bio, phone, email, photo_url, updated_at)
      VALUES (1, @name, @bio, @phone, @email, @photoUrl, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        name = COALESCE(@name, name),
        bio = COALESCE(@bio, bio),
        phone = COALESCE(@phone, phone),
        email = COALESCE(@email, email),
        photo_url = COALESCE(@photoUrl, photo_url),
        updated_at = @updatedAt
    `).run({ name: data.name ?? null, bio: data.bio ?? null, phone: data.phone ?? null, email: data.email ?? null, photoUrl: data.photoUrl ?? null, updatedAt });
  },
};
