import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Nav from "@/components/Nav";
import { useToast } from "@/hooks/use-toast";
import DriverProfileEditor from "@/components/DriverProfileEditor";
import type { Booking } from "@shared/schema";

const BACKEND = "https://backend-production-507b.up.railway.app";

type Profile = { name?: string | null; bio?: string | null; phone?: string | null; email?: string | null; photoUrl?: string | null };

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

type Msg = { id: number; bookingId: number; sender: string; text: string; sentAt: string };

function MessageThread({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch } = useQuery<Msg[]>({
    queryKey: [`/api/bookings/${booking.id}/messages`],
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    sendMsg.mutate(t);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: "560px",
        background: "var(--surface-2)",
        border: "1px solid var(--border-color)",
        borderRadius: "1.2rem 1.2rem 0 0",
        maxHeight: "80vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{booking.customerName}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
              {booking.bookingType} · {booking.scheduledDate} {booking.scheduledTime}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", marginTop: "2rem" }}>
              No messages yet. Start the conversation.
            </p>
          )}
          {messages.map(m => {
            const isDriver = m.sender === "driver";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isDriver ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", padding: "0.6rem 0.9rem",
                  borderRadius: isDriver ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem",
                  background: isDriver ? "var(--green)" : "var(--surface-3)",
                  color: isDriver ? "#000" : "var(--text)",
                  fontSize: "0.88rem", lineHeight: 1.5,
                }}>
                  <p style={{ margin: 0 }}>{m.text}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", opacity: 0.6, textAlign: "right" }}>
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem" }}>
          <input
            style={{
              flex: 1, background: "var(--surface-3)", border: "1px solid var(--border-color)",
              borderRadius: "0.6rem", padding: "0.6rem 0.9rem",
              color: "var(--text)", fontSize: "0.9rem", outline: "none",
              fontFamily: "'Satoshi', sans-serif",
            }}
            placeholder="Message customer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMsg.isPending}
            style={{
              padding: "0.6rem 1rem", borderRadius: "0.6rem",
              background: "var(--green)", color: "#000",
              border: "none", fontWeight: 700, fontSize: "0.88rem",
              cursor: input.trim() ? "pointer" : "not-allowed",
              opacity: input.trim() ? 1 : 0.4,
              transition: "opacity 0.15s",
              fontFamily: "'Satoshi', sans-serif",
            }}
          >Send</button>
        </div>
      </div>
    </div>
  );
}

export default function DriverPortal() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [showPaySettings, setShowPaySettings] = useState(false);
  const [payForm, setPayForm] = useState({ cashapp: "", venmo: "", paypal: "" });
  const [activeMsg, setActiveMsg] = useState<Booking | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const { data: driverProfile = {} as Profile } = useQuery<Profile>({
    queryKey: ["/api/driver/profile"],
  });

  // Live polling — refresh every 8s
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 8000,
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    onSuccess: (data: Record<string, string>) => {
      setPayForm({ cashapp: data.cashapp || "", venmo: data.venmo || "", paypal: data.paypal || "" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookings"] }),
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/settings", { key, value });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings"] }),
  });

  const savePaySettings = async () => {
    await Promise.all([
      saveSetting.mutateAsync({ key: "cashapp", value: payForm.cashapp }),
      saveSetting.mutateAsync({ key: "venmo", value: payForm.venmo }),
      saveSetting.mutateAsync({ key: "paypal", value: payForm.paypal }),
    ]);
    toast({ title: "Payment settings saved" });
    setShowPaySettings(false);
  };

  const filtered = bookings.filter(b => filter === "all" ? true : b.status === filter);
  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    in_progress: bookings.filter(b => b.status === "in_progress").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      {activeMsg && <MessageThread booking={activeMsg} onClose={() => setActiveMsg(null)} />}
      {showProfileEditor && <DriverProfileEditor onClose={() => setShowProfileEditor(false)} />}

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="badge-purple" style={{ marginBottom: "0.5rem", display: "inline-block" }}>DOF · Driver Ops</span>
            <h1 style={{ fontSize: "1.8rem", letterSpacing: "-0.02em" }}>Driver Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Live jobs — updates every 8 seconds.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            {/* Driver mini-profile */}
            <div
              className="card"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", minWidth: "160px" }}
              onClick={() => setShowProfileEditor(true)}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                border: "2px solid var(--green)",
                background: "var(--surface-3)",
                overflow: "hidden", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {driverProfile.photoUrl ? (
                  <img src={`${BACKEND}${driverProfile.photoUrl}`} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.4rem" }}>👤</span>
                )}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2 }}>{driverProfile.name || "Set Profile"}</p>
                <p style={{ color: "var(--green)", fontSize: "0.72rem" }}>Edit →</p>
              </div>
            </div>
            <button
              className="btn-outline"
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem", borderColor: "var(--purple)", color: "var(--purple)" }}
              onClick={() => { setPayForm({ cashapp: settings.cashapp || "", venmo: settings.venmo || "", paypal: settings.paypal || "" }); setShowPaySettings(s => !s); }}
            >
              💳 Payment Settings
            </button>
          </div>
        </div>

        {/* Payment Settings Panel */}
        {showPaySettings && (
          <div className="card" style={{ marginBottom: "2rem", border: "1px solid rgba(168,85,247,0.3)", boxShadow: "0 0 18px rgba(168,85,247,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Payment Handles</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>Customers see these after booking so they can pay you directly.</p>
              </div>
              <button onClick={() => setShowPaySettings(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.25rem" }}>
              {[
                { key: "cashapp", label: "Cash App", placeholder: "$YourCashTag" },
                { key: "venmo", label: "Venmo", placeholder: "@YourVenmo" },
                { key: "paypal", label: "PayPal", placeholder: "paypal.me/YourLink or email" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.82rem" }}>{label}</label>
                  <input
                    className="input-field"
                    placeholder={placeholder}
                    value={payForm[key as keyof typeof payForm]}
                    onChange={e => setPayForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button className="btn-purple" style={{ width: "100%" }} onClick={savePaySettings} disabled={saveSetting.isPending}>
              {saveSetting.isPending ? "Saving..." : "Save Payment Settings"}
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
          {[
            { label: "New Requests", value: counts.pending, color: "#f59e0b" },
            { label: "Confirmed", value: counts.confirmed, color: "var(--green)" },
            { label: "In Progress", value: counts.in_progress, color: "var(--purple)" },
            { label: "Completed", value: counts.completed, color: "#94a3b8" },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{s.label}</p>
              <p style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "in_progress", "completed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "0.4rem 0.9rem", borderRadius: "999px",
              border: `1px solid ${filter === f ? "var(--green)" : "var(--border-color)"}`,
              background: filter === f ? "var(--green-glow)" : "transparent",
              color: filter === f ? "var(--green)" : "var(--text-muted)",
              fontSize: "0.8rem", fontWeight: filter === f ? 700 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {f === "all" ? "All" : f.replace("_", " ")} ({counts[f as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>

        {/* Bookings */}
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
                  {/* Left */}
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "1.4rem" }}>{TYPE_ICONS[b.bookingType] || "📋"}</span>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {b.bookingType.charAt(0).toUpperCase() + b.bookingType.slice(1)}
                      </span>
                      <span style={{
                        padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                        background: b.status === "pending" ? "rgba(245,158,11,0.15)" :
                          b.status === "confirmed" ? "rgba(34,197,94,0.15)" :
                          b.status === "in_progress" ? "rgba(168,85,247,0.15)" : "rgba(148,163,184,0.15)",
                        color: b.status === "pending" ? "#f59e0b" :
                          b.status === "confirmed" ? "var(--green)" :
                          b.status === "in_progress" ? "var(--purple)" : "#94a3b8",
                      }}>
                        {b.status.replace("_", " ")}
                      </span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.2rem" }}>{b.customerName}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "0.5rem" }}>{b.customerPhone}</p>
                    <div style={{ display: "grid", gap: "0.3rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.83rem" }}>
                        <span style={{ color: "var(--green)", fontWeight: 700 }}>↑</span>
                        <span style={{ color: "var(--text-muted)" }}>{b.pickupAddress}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.83rem" }}>
                        <span style={{ color: "var(--purple)", fontWeight: 700 }}>↓</span>
                        <span style={{ color: "var(--text-muted)" }}>{b.dropoffAddress}</span>
                      </div>
                    </div>
                    {b.notes && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>"{b.notes}"</p>
                    )}
                  </div>

                  {/* Right */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{b.scheduledDate}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>{b.scheduledTime}</p>
                    </div>

                    {/* Message button */}
                    <button
                      onClick={() => setActiveMsg(b)}
                      style={{
                        padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                        border: "1px solid var(--border-color)",
                        background: "var(--surface-3)", color: "var(--text-muted)",
                        fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green)"; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      💬 Message
                    </button>

                    {/* Status action */}
                    {STATUS_FLOW[b.status] && (
                      <button
                        className={b.status === "pending" ? "btn-green" : "btn-purple"}
                        style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", opacity: updateStatus.isPending ? 0.5 : 1, width: "100%" }}
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: b.id, status: STATUS_FLOW[b.status] })}
                      >
                        {STATUS_LABELS[b.status]}
                      </button>
                    )}

                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <button
                        style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", borderRadius: "0.4rem", border: "1px solid #ef4444", color: "#ef4444", background: "transparent", cursor: "pointer", width: "100%" }}
                        onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
