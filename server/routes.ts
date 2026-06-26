import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertMemberSchema } from "@shared/schema";
import { z } from "zod";

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

  app.patch("/api/bookings/:id/status", (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const booking = storage.updateBookingStatus(id, status);
    if (!booking) return res.status(404).json({ error: "Not found" });
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
