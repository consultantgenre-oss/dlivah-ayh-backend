import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertMemberSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Images only"));
  },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── Bookings ──────────────────────────────────────────────────────────
  app.get("/api/bookings", (_req, res) => {
    const bookings = storage.getBookings();
    res.json(bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const result = insertBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid booking data", details: result.error.flatten() });
    }
    const booking = storage.createBooking(result.data);
    res.status(201).json(booking);
  });

  app.get("/api/bookings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const booking = storage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: "Not found" });
    res.json(booking);
  });

  // ── Constants ─────────────────────────────────────────────────────────
  const MAINTENANCE_FEE = 1.59;   // infrastructure maintenance
  const ACQUISITION_FEE = 1.40;  // driver acquisition / platform access
  const PLATFORM_FEE = MAINTENANCE_FEE + ACQUISITION_FEE; // $2.99 total

  // ── Fire Zapier webhook (non-blocking) ───────────────────────────────
  async function fireZapierWebhook(entry: any, zapierUrl: string) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(zapierUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "job_completed",
          bookingId: entry.bookingId,
          customerName: entry.customerName,
          bookingType: entry.bookingType,
          grossFare: entry.grossFare,
          platformFee: entry.platformFee,
          driverPayout: entry.driverPayout,
          completedAt: entry.completedAt,
        }),
        signal: controller.signal,
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  app.patch("/api/bookings/:id/status", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { status } = z.object({ status: z.string() }).parse(req.body);

    const { booking, wasCompleted } = storage.updateBookingStatusFull(id, status);
    if (!booking) return res.status(404).json({ error: "Not found" });

    // ── Write ledger entry when a job transitions to 'completed' ────
    if (wasCompleted) {
      const rawFare = parseFloat((booking.estimatedPrice || "0").replace(/[^0-9.]/g, ""));
      const grossFare = rawFare > 0 ? rawFare : 0;
      const driverPayout = Math.max(0, grossFare - PLATFORM_FEE);

      const entry = storage.createLedgerEntry({
        bookingId: booking.id,
        customerName: booking.customerName,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        bookingType: booking.bookingType,
        grossFare: grossFare.toFixed(2),
        maintenanceFee: MAINTENANCE_FEE.toFixed(2),
        acquisitionFee: ACQUISITION_FEE.toFixed(2),
        platformFee: PLATFORM_FEE.toFixed(2),
        driverPayout: driverPayout.toFixed(2),
        payoutStatus: "pending",
        completedAt: new Date().toISOString(),
        webhookSentAt: null,
        stripeTransferId: null,
      });

      // Fire Zapier webhook if configured
      const zapierUrl = storage.getSetting("zapier_webhook_url");
      if (zapierUrl) {
        const sent = await fireZapierWebhook(entry, zapierUrl);
        if (sent) {
          storage.updateLedgerPayoutStatus(entry.id, "zapier_triggered", {
            webhookSentAt: new Date().toISOString(),
          });
        }
      }
    }

    res.json(booking);
  });

  // ── Members ───────────────────────────────────────────────────────────
  app.get("/api/members", (_req, res) => {
    const members = storage.getMembers();
    res.json(members);
  });

  app.post("/api/members", (req, res) => {
    const result = insertMemberSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid member data", details: result.error.flatten() });
    }
    const member = storage.createMember(result.data);
    res.status(201).json(member);
  });

  app.get("/api/members/role/:role", (req, res) => {
    const members = storage.getMembersByRole(req.params.role);
    res.json(members);
  });

  app.get("/api/members/pending", (_req, res) => {
    res.json(storage.getMembersPendingPayment());
  });

  app.get("/api/members/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const member = storage.getMemberById(id);
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(member);
  });

  app.patch("/api/members/:id/confirm-payment", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { paymentRef } = z.object({ paymentRef: z.string().optional() }).parse(req.body);
    const member = storage.confirmPayment(id, paymentRef);
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(member);
  });

  app.delete("/api/members/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const deleted = storage.deleteMember(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  // ── Referrals ─────────────────────────────────────────────────────────
  app.get("/api/members/:id/referrals", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const referrals = storage.getReferrals(id);
    const count = referrals.length;
    // Referral credit per role (from the referral program rules)
    const member = storage.getMemberById(id);
    const creditMap: Record<string, number> = { FOC: 10, DOF: 0, BP: 10 }; // DOF gets month extension not credit
    const creditPerReferral = member ? (creditMap[member.role] ?? 10) : 10;
    const totalCredits = count * creditPerReferral;
    res.json({
      count,
      totalCredits,
      creditPerReferral,
      referrals: referrals.map(r => ({
        id: r.id,
        name: r.name,
        role: r.role,
        paymentStatus: r.paymentStatus,
        joinedAt: r.joinedAt,
      })),
    });
  });

  // ── Driver Accounts ────────────────────────────────────────────────────
  app.post("/api/drivers/register", (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(6),
      vehicleType: z.string().min(1),
      licenseNumber: z.string().min(1),
      pin: z.string().min(4),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid fields", details: parsed.error.flatten() });
    const { name, email, phone, vehicleType, licenseNumber, pin } = parsed.data;
    // Check duplicate email
    const existing = storage.getDriverByEmail(email);
    if (existing) return res.status(409).json({ error: "An account with that email already exists." });
    const driver = storage.registerDriver({
      name, email, phone, vehicleType, licenseNumber, pin,
      status: "pending",
      joinedAt: new Date().toISOString(),
    });
    res.json({ id: driver.id, name: driver.name, email: driver.email, status: driver.status });
  });

  app.post("/api/drivers/login", (req, res) => {
    const schema = z.object({ email: z.string().email(), pin: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid fields" });
    const { email, pin } = parsed.data;
    const driver = storage.getDriverByEmail(email);
    if (!driver) return res.status(401).json({ error: "No account found for that email." });
    if (driver.pin !== pin) return res.status(401).json({ error: "Incorrect PIN." });
    res.json({ id: driver.id, name: driver.name, email: driver.email, status: driver.status, vehicleType: driver.vehicleType });
  });

  app.get("/api/drivers", (_req, res) => {
    const all = storage.getAllDrivers().map(d => ({ ...d, pin: undefined }));
    res.json(all);
  });

  app.patch("/api/drivers/:id/status", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { status } = z.object({ status: z.enum(["pending", "active"]) }).parse(req.body);
    storage.updateDriverStatus(id, status);
    res.json({ ok: true });
  });

  // ── Driver Profile ─────────────────────────────────────────────────────
  app.get("/api/driver/profile", (_req, res) => {
    res.json(storage.getDriverProfile() || {});
  });

  app.post("/api/driver/profile", (req, res) => {
    const data = z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      photoUrl: z.string().optional(),
    }).parse(req.body);
    storage.updateDriverProfile(data);
    res.json(storage.getDriverProfile());
  });

  app.post("/api/driver/photo", upload.single("photo"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const ext = path.extname(req.file.originalname) || ".jpg";
    const newName = `driver-${Date.now()}${ext}`;
    const newPath = path.join(uploadDir, newName);
    fs.renameSync(req.file.path, newPath);
    const url = `/uploads/${newName}`;
    storage.updateDriverProfile({ photoUrl: url });
    res.json({ url });
  });

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  // ── Messages ─────────────────────────────────────────────────────────
  app.get("/api/bookings/:id/messages", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    res.json(storage.getMessages(id));
  });

  app.post("/api/bookings/:id/messages", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { sender, text } = z.object({ sender: z.string(), text: z.string().min(1) }).parse(req.body);
    const msg = storage.sendMessage(id, sender, text);
    res.status(201).json(msg);
  });

  // ── Settings ──────────────────────────────────────────────────────────
  app.get("/api/settings", (_req, res) => {
    res.json(storage.getAllSettings());
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = z.object({ key: z.string(), value: z.string() }).parse(req.body);
    storage.setSetting(key, value);
    res.json({ ok: true });
  });

  // ── Earnings Ledger ──────────────────────────────────────────────────
  app.get("/api/earnings", (_req, res) => {
    res.json(storage.getLedgerEntries());
  });

  app.get("/api/earnings/summary", (_req, res) => {
    res.json(storage.getLedgerSummary());
  });

  app.patch("/api/earnings/:id/mark-paid", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    storage.updateLedgerPayoutStatus(id, "paid");
    res.json({ ok: true });
  });

  // ── Stats ─────────────────────────────────────────────────────────────
  app.get("/api/stats", (_req, res) => {
    const bookings = storage.getBookings();
    const members = storage.getMembers();
    res.json({
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      completedBookings: bookings.filter(b => b.status === "completed").length,
      totalMembers: members.length,
      focMembers: members.filter(m => m.role === "FOC").length,
      dofMembers: members.filter(m => m.role === "DOF").length,
      bpMembers: members.filter(m => m.role === "BP").length,
    });
  });

  return httpServer;
}
