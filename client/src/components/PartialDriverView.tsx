import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Nav from "@/components/Nav";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";

const BACKEND = "https://backend-production-507b.up.railway.app";

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "in_progress",
  in_progress: "completed",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Accept Job",
  confirmed: "Start Job",
  in_progress: "Complete Job",
};
const TYPE_ICONS: Record<string, string> = { ride: "🚗", move: "📦", delivery: "🔁" };

type LedgerEntry = {
  id: number; bookingId: number; customerName: string;
  pickupAddress: string; dropoffAddress: string; bookingType: string;
  grossFare: string;
  maintenanceFee: string; // $1.59
  acquisitionFee: string; // $1.40
  platformFee: string;    // $2.99 total
  driverPayout: string;
  payoutStatus: string; completedAt: string;
};
type LedgerSummary = {
  totalGross: number; totalPlatformFees: number;
  totalDriverPayout: number; totalJobs: number; pendingPayout: number;
};
type DriverInfo = { id: number; name: string; email: string; status: string; vehicleType: string };
type Msg = { id: number; bookingId: number; sender: string; text: string; sentAt: string };

function MessageThread({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [input, setInput] = useState("");
  const { data: messages = [], } = useQuery<Msg[]>({
    queryKey: [`/api/bookings/${booking.id}/messages`],
    refetchInterval: 4000,
  });
  const sendMsg = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", `/api/bookings/${booking.id}/messages`, { sender: "driver", text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}/messages`] });
      setInput("");
    },
  });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "560px", background: "var(--surface-2)", border: "1px solid var(--border-color)", borderRadius: "1.2rem 1.2rem 0 0", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{booking.customerName}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{booking.bookingType} · {booking.scheduledDate} {booking.scheduledTime}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {messages.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", marginTop: "2rem" }}>No messages yet.</p>}
          {messages.map(m => {
            const isDriver = m.sender === "driver";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isDriver ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "75%", padding: "0.6rem 0.9rem", borderRadius: isDriver ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem", background: isDriver ? "var(--green)" : "var(--surface-3)", color: isDriver ? "#000" : "var(--text)", fontSize: "0.88rem" }}>
                  <p style={{ margin: 0 }}>{m.text}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", opacity: 0.6, textAlign: "right" }}>{new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem" }}>
          <input style={{ flex: 1, background: "var(--surface-3)", border: "1px solid var(--border-color)", borderRadius: "0.6rem", padding: "0.6rem 0.9rem", color: "var(--text)", fontSize: "0.9rem", outline: "none" }}
            placeholder="Message customer..." value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMsg.mutate(input.trim()); } }}
          />
          <button onClick={() => { if (input.trim()) sendMsg.mutate(input.trim()); }} disabled={!input.trim() || sendMsg.isPending}
            style={{ padding: "0.6rem 1rem", borderRadius: "0.6rem", background: "var(--green)", color: "#000", border: "none", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartialDriverView({ driverId, onLogout }: { driverId: number; onLogout: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"jobs" | "wallet">("jobs");
  const [filter, setFilter] = useState<string>("all");
  const [activeMsg, setActiveMsg] = useState<Booking | null>(null);

  const { data: driverInfo } = useQuery<DriverInfo>({
    queryKey: ["/api/drivers", driverId],
    queryFn: () => fetch(`${BACKEND}/api/drivers`).then(r => r.json()).then((list: DriverInfo[]) => list.find(d => d.id === driverId)!),
  });

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 8000,
  });

  const { data: ledger = [] } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/earnings"],
    queryFn: () => fetch(`${BACKEND}/api/earnings`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const { data: summary } = useQuery<LedgerSummary>({
    queryKey: ["/api/earnings/summary"],
    queryFn: () => fetch(`${BACKEND}/api/earnings/summary`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings/summary"] });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  // Time window helpers
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);

  const todayEntries = ledger.filter(e => e.completedAt.slice(0, 10) === todayStr);
  const weekEntries = ledger.filter(e => new Date(e.completedAt) >= weekStart);
  const sum = (arr: LedgerEntry[]) => arr.reduce((s, e) => s + parseFloat(e.driverPayout || "0"), 0);

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    in_progress: bookings.filter(b => b.status === "in_progress").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };
  const filtered = bookings.filter(b => filter === "all" ? true : b.status === filter);

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      {activeMsg && <MessageThread booking={activeMsg} onClose={() => setActiveMsg(null)} />}

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="badge-purple" style={{ marginBottom: "0.5rem", display: "inline-block" }}>DOF · Driver Portal</span>
            <h1 style={{ fontSize: "1.6rem", letterSpacing: "-0.02em" }}>{driverInfo?.name || "Driver Portal"}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
              {driverInfo?.vehicleType} ·{" "}
              <span style={{ color: driverInfo?.status === "active" ? "var(--green)" : "#f59e0b", fontWeight: 700 }}>
                {driverInfo?.status === "active" ? "Active" : "Pending Approval"}
              </span>
            </p>
          </div>
          <button onClick={onLogout} style={{ fontSize: "0.75rem", padding: "0.35rem 0.85rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "2rem" }}>
          {(["jobs", "wallet"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0.45rem 1.2rem", borderRadius: "0.5rem",
              border: `1px solid ${tab === t ? "var(--green)" : "var(--border-color)"}`,
              background: tab === t ? "var(--green-glow)" : "transparent",
              color: tab === t ? "var(--green)" : "var(--text-muted)",
              fontWeight: tab === t ? 700 : 500, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.15s",
            }}>
              {t === "jobs" ? "Jobs" : "My Wallet"}
            </button>
          ))}
        </div>

        {/* ── JOBS TAB ── */}
        {tab === "jobs" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1.75rem" }}>
              {[
                { label: "New Requests", value: counts.pending, color: "#f59e0b" },
                { label: "Confirmed", value: counts.confirmed, color: "var(--green)" },
                { label: "In Progress", value: counts.in_progress, color: "var(--purple)" },
                { label: "Completed", value: counts.completed, color: "#94a3b8" },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{s.label}</p>
                  <p style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {["all", "pending", "confirmed", "in_progress", "completed"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "0.4rem 0.9rem", borderRadius: "999px",
                  border: `1px solid ${filter === f ? "var(--green)" : "var(--border-color)"}`,
                  background: filter === f ? "var(--green-glow)" : "transparent",
                  color: filter === f ? "var(--green)" : "var(--text-muted)",
                  fontSize: "0.8rem", fontWeight: filter === f ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {f === "all" ? "All" : f.replace("_", " ")} ({counts[f as keyof typeof counts] ?? 0})
                </button>
              ))}
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading jobs...</div>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
                <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>📋</p>
                <p style={{ color: "var(--text-muted)" }}>No {filter === "all" ? "" : filter} bookings yet.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {[...filtered].reverse().map(b => (
                  <div key={b.id} className="card" style={{
                    borderColor: b.status === "pending" ? "rgba(245,158,11,0.35)" :
                      b.status === "in_progress" ? "rgba(168,85,247,0.35)" :
                      b.status === "confirmed" ? "rgba(34,197,94,0.35)" : "var(--border-color)",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1.3rem" }}>{TYPE_ICONS[b.bookingType] || "📋"}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{b.bookingType.charAt(0).toUpperCase() + b.bookingType.slice(1)}</span>
                          <span style={{
                            padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                            background: b.status === "pending" ? "rgba(245,158,11,0.15)" : b.status === "confirmed" ? "rgba(34,197,94,0.15)" : b.status === "in_progress" ? "rgba(168,85,247,0.15)" : "rgba(148,163,184,0.15)",
                            color: b.status === "pending" ? "#f59e0b" : b.status === "confirmed" ? "var(--green)" : b.status === "in_progress" ? "var(--purple)" : "#94a3b8",
                          }}>{b.status.replace("_", " ")}</span>
                          {b.estimatedPrice && (
                            <span style={{ fontWeight: 800, color: "var(--green)", fontSize: "0.9rem" }}>{b.estimatedPrice}</span>
                          )}
                        </div>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{b.customerName}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "0.4rem" }}>{b.customerPhone}</p>
                        <div style={{ display: "grid", gap: "0.25rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem" }}>
                            <span style={{ color: "var(--green)", fontWeight: 700 }}>↑</span>
                            <span style={{ color: "var(--text-muted)" }}>{b.pickupAddress}</span>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem" }}>
                            <span style={{ color: "var(--purple)", fontWeight: 700 }}>↓</span>
                            <span style={{ color: "var(--text-muted)" }}>{b.dropoffAddress}</span>
                          </div>
                        </div>
                        {b.notes && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem", fontStyle: "italic" }}>"{b.notes}"</p>}
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.55rem" }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.88rem" }}>{b.scheduledDate}</p>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{b.scheduledTime}</p>
                        </div>
                        <button onClick={() => setActiveMsg(b)} style={{
                          padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                          border: "1px solid var(--border-color)", background: "var(--surface-3)",
                          color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer",
                        }}>💬 Message</button>
                        {STATUS_FLOW[b.status] && (
                          <button
                            className={b.status === "pending" ? "btn-green" : "btn-purple"}
                            style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", opacity: updateStatus.isPending ? 0.5 : 1, width: "100%" }}
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: b.id, status: STATUS_FLOW[b.status] })}
                          >{STATUS_LABELS[b.status]}</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WALLET TAB ── */}
        {tab === "wallet" && (
          <div>
            {/* Earnings summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.85rem", marginBottom: "2rem" }}>
              {[
                { label: "Today", value: sum(todayEntries), jobs: todayEntries.length },
                { label: "Last 7 Days", value: sum(weekEntries), jobs: weekEntries.length },
                { label: "All Time", value: summary?.totalDriverPayout ?? 0, jobs: ledger.length },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: "center", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{s.label}</p>
                  <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--green)", lineHeight: 1 }}>${s.value.toFixed(2)}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.3rem" }}>{s.jobs} job{s.jobs !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            {/* Pending payout callout */}
            {(summary?.pendingPayout ?? 0) > 0 && (
              <div style={{
                background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: "0.85rem", padding: "1rem 1.25rem", marginBottom: "1.5rem",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>Pending Payout</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                    Earnings from completed jobs awaiting payment.
                  </p>
                </div>
                <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--green)", whiteSpace: "nowrap" }}>
                  ${summary!.pendingPayout.toFixed(2)}
                </p>
              </div>
            )}

            {/* Per-ride breakdown */}
            <div className="card">
              <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Ride History
              </p>
              {ledger.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--text-muted)" }}>
                  <p style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>💳</p>
                  <p style={{ fontSize: "0.88rem" }}>No completed rides yet. Earnings appear here when jobs are marked complete.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0" }}>
                  {ledger.map(e => (
                    <div key={e.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      padding: "0.85rem 0", borderBottom: "1px solid var(--border-color)",
                      gap: "1rem", flexWrap: "wrap",
                    }}>
                      <div style={{ flex: 1, minWidth: "180px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1rem" }}>{TYPE_ICONS[e.bookingType] || "📋"}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{e.customerName}</span>
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "999px",
                            background: e.payoutStatus === "paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                            color: e.payoutStatus === "paid" ? "#22c55e" : "#f59e0b",
                          }}>{e.payoutStatus === "paid" ? "Paid Out" : "Pending"}</span>
                        </div>
                        <p style={{ fontSize: "0.77rem", color: "var(--text-muted)" }}>
                          {e.pickupAddress} → {e.dropoffAddress}
                        </p>
                        <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          {new Date(e.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: 900, color: "var(--green)", fontSize: "1.1rem" }}>
                          ${parseFloat(e.driverPayout).toFixed(2)}
                        </p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          of ${parseFloat(e.grossFare).toFixed(2)} gross
                        </p>
                        <div style={{ marginTop: "0.35rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.3rem" }}>
                          <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                            − ${ (e.maintenanceFee ? parseFloat(e.maintenanceFee).toFixed(2) : "1.59") } maint.
                          </p>
                          <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                            − ${ (e.acquisitionFee ? parseFloat(e.acquisitionFee).toFixed(2) : "1.40") } acq.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
