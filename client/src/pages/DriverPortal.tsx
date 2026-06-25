import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Nav from "@/components/Nav";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";

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

const TYPE_ICONS: Record<string, string> = {
  ride: "🚗",
  move: "📦",
  delivery: "🔁",
};

export default function DriverPortal() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [showPaySettings, setShowPaySettings] = useState(false);
  const [payForm, setPayForm] = useState({ cashapp: "", venmo: "", paypal: "" });

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    onSuccess: (data: Record<string, string>) => {
      setPayForm({
        cashapp: data.cashapp || "",
        venmo: data.venmo || "",
        paypal: data.paypal || "",
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/settings", { key, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
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

  const filtered = bookings.filter(b =>
    filter === "all" ? true : b.status === filter
  );

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
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="badge-purple" style={{ marginBottom: "0.5rem", display: "inline-block" }}>DOF · Driver Ops</span>
            <h1 style={{ fontSize: "1.8rem", letterSpacing: "-0.02em" }}>Driver Dashboard</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>All incoming bookings — manage your jobs here.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <div className="card" style={{ textAlign: "center", minWidth: "120px" }}>
              <p className="section-label">Active Jobs</p>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--green)", lineHeight: 1.2, marginTop: "0.25rem" }}>
                {counts.confirmed + counts.in_progress}
              </p>
            </div>
            <button
              className="btn-outline"
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem", borderColor: "var(--purple)", color: "var(--purple)" }}
              onClick={() => {
                setPayForm({ cashapp: settings.cashapp || "", venmo: settings.venmo || "", paypal: settings.paypal || "" });
                setShowPaySettings(s => !s);
              }}
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
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  Customers see these after booking so they can pay you directly.
                </p>
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
            <button
              className="btn-purple"
              style={{ width: "100%" }}
              onClick={savePaySettings}
              disabled={saveSetting.isPending}
            >
              {saveSetting.isPending ? "Saving..." : "Save Payment Settings"}
            </button>
          </div>
        )}

        {/* Stats row */}
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

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "in_progress", "completed"].map(f => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                border: `1px solid ${filter === f ? "var(--green)" : "var(--border-color)"}`,
                background: filter === f ? "var(--green-glow)" : "transparent",
                color: filter === f ? "var(--green)" : "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: filter === f ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f === "all" ? "All" : f.replace("_", " ")} ({counts[f as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>

        {/* Bookings list */}
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
              <div
                key={b.id}
                className="card"
                data-testid={`booking-card-${b.id}`}
                style={{
                  borderColor: b.status === "pending" ? "rgba(245,158,11,0.3)" :
                    b.status === "in_progress" ? "rgba(168,85,247,0.3)" : "var(--border-color)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  {/* Left */}
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                      <span style={{ fontSize: "1.4rem" }}>{TYPE_ICONS[b.bookingType] || "📋"}</span>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {b.bookingType.charAt(0).toUpperCase() + b.bookingType.slice(1)}
                      </span>
                      <span className={`status-pill status-${b.status}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{b.customerName}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "0.5rem" }}>{b.customerPhone}</p>
                    <div style={{ display: "grid", gap: "0.3rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.83rem" }}>
                        <span style={{ color: "var(--green)", fontWeight: 600 }}>↑</span>
                        <span style={{ color: "var(--text-muted)" }}>{b.pickupAddress}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.83rem" }}>
                        <span style={{ color: "var(--purple)", fontWeight: 600 }}>↓</span>
                        <span style={{ color: "var(--text-muted)" }}>{b.dropoffAddress}</span>
                      </div>
                    </div>
                    {b.notes && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>
                        "{b.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{b.scheduledDate}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>{b.scheduledTime}</p>
                    </div>
                    {STATUS_FLOW[b.status] && (
                      <button
                        className={b.status === "pending" ? "btn-green" : "btn-purple"}
                        style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", opacity: updateStatus.isPending ? 0.5 : 1 }}
                        disabled={updateStatus.isPending}
                        data-testid={`button-action-${b.id}`}
                        onClick={() => updateStatus.mutate({ id: b.id, status: STATUS_FLOW[b.status] })}
                      >
                        {STATUS_LABELS[b.status]}
                      </button>
                    )}
                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <button
                        className="btn-outline"
                        style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", borderColor: "#ef4444", color: "#ef4444" }}
                        data-testid={`button-cancel-${b.id}`}
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
