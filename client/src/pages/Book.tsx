import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Nav from "@/components/Nav";
import { useToast } from "@/hooks/use-toast";
import DriverProfileCard from "@/components/DriverProfileCard";

const SERVICE_TYPES = [
  { id: "ride", label: "Ride", icon: "🚗", desc: "Pickup & drop-off anywhere", badge: "Quick" },
  { id: "move", label: "Move", icon: "📦", desc: "Local residential moving", badge: "Scheduled" },
  { id: "delivery", label: "Delivery", icon: "🔁", desc: "Item or package delivery", badge: "Same Day" },
];

export default function Book() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const preType = params.get("type") || "";

  const [step, setStep] = useState(1);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll confirm button into view when reaching step 3
  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        confirmBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [step]);
  const [form, setForm] = useState({
    bookingType: preType,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupAddress: "",
    dropoffAddress: "",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
  });
  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/bookings", {
        ...data,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setConfirmed(true);
      setBookingId(data?.id || null);
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  const canNext1 = form.bookingType !== "";
  const canNext2 = form.customerName && form.customerPhone && form.pickupAddress && form.dropoffAddress;
  // Time is valid when all three parts (hr:min AM/PM) are set
  const timeValid = (() => {
    if (!form.scheduledTime) return false;
    const parts = form.scheduledTime.split(/:| /);
    return parts.length === 3 && parts[0] !== "" && parts[1] !== "" && (parts[2] === "AM" || parts[2] === "PM");
  })();
  const canNext3 = form.scheduledDate && timeValid;

  const payMethods = [
    { key: "cashapp", label: "Cash App", icon: "💚" },
    { key: "venmo", label: "Venmo", icon: "💙" },
    { key: "paypal", label: "PayPal", icon: "💛" },
  ].filter(m => settings[m.key]);

  if (confirmed) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <Nav />
        <div style={{ maxWidth: "560px", margin: "5rem auto", padding: "0 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>✅</div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Booking Received</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
            We've got your {form.bookingType} request for <strong>{form.scheduledDate}</strong> at <strong>{form.scheduledTime}</strong>.
            We'll confirm shortly via text.
          </p>
          <DriverProfileCard />

          <div className="card" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                ["Name", form.customerName],
                ["Phone", form.customerPhone],
                ["Pickup", form.pickupAddress],
                ["Drop-off", form.dropoffAddress],
                ["Service", form.bookingType.charAt(0).toUpperCase() + form.bookingType.slice(1)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{k}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {payMethods.length > 0 && (
            <div className="card" style={{ marginBottom: "2rem", textAlign: "left", border: "1px solid rgba(34,197,94,0.25)" }}>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.2rem" }}>Send Payment</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "1rem" }}>
                Pay your driver directly using any of the options below.
              </p>
              <div style={{ display: "grid", gap: "0.65rem" }}>
                {payMethods.map(m => (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{m.icon} {m.label}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--green)" }}>{settings[m.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingId && (
            <a
              href={`/#/messages/${bookingId}`}
              style={{
                display: "block", width: "100%", textAlign: "center",
                padding: "0.8rem", borderRadius: "0.6rem", marginBottom: "0.75rem",
                border: "1px solid var(--green)", color: "var(--green)",
                fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                background: "rgba(34,197,94,0.08)",
              }}
            >
              💬 Message Your Driver
            </a>
          )}
          <button className="btn-green" style={{ width: "100%" }} onClick={() => { setConfirmed(false); setStep(1); setBookingId(null); setForm({ bookingType: "", customerName: "", customerPhone: "", customerEmail: "", pickupAddress: "", dropoffAddress: "", scheduledDate: "", scheduledTime: "", notes: "" }); }}>
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "640px", margin: "3rem auto", padding: "0 1.5rem 5rem" }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: step === s ? "var(--green)" : step > s ? "var(--green-dim)" : "var(--surface-3)",
                border: `2px solid ${step >= s ? "var(--green)" : "var(--border-color)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                color: step >= s ? "#000" : "var(--text-muted)",
                transition: "all 0.2s",
              }}>
                {step > s ? "✓" : s}
              </div>
              <span style={{ fontSize: "0.8rem", color: step === s ? "var(--text)" : "var(--text-muted)", fontWeight: step === s ? 600 : 400 }}>
                {["Service", "Details", "Schedule"][s - 1]}
              </span>
              {s < 3 && <div style={{ flex: 1, height: "1px", width: "30px", background: step > s ? "var(--green)" : "var(--border-color)" }} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>What do you need?</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Select a service to get started.</p>
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
              {SERVICE_TYPES.map(svc => (
                <div
                  key={svc.id}
                  className="card"
                  data-testid={`card-service-${svc.id}`}
                  onClick={() => set("bookingType", svc.id)}
                  style={{
                    cursor: "pointer",
                    border: `1px solid ${form.bookingType === svc.id ? "var(--green)" : "var(--border-color)"}`,
                    boxShadow: form.bookingType === svc.id ? "0 0 16px var(--green-glow)" : "none",
                    display: "flex", alignItems: "center", gap: "1rem",
                    transition: "all 0.18s",
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{svc.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>{svc.label}</span>
                      <span className="badge-green">{svc.badge}</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{svc.desc}</p>
                  </div>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${form.bookingType === svc.id ? "var(--green)" : "var(--border-color)"}`, background: form.bookingType === svc.id ? "var(--green)" : "transparent", flexShrink: 0 }} />
                </div>
              ))}
            </div>
            <button className="btn-green" style={{ width: "100%", opacity: canNext1 ? 1 : 0.4 }} disabled={!canNext1} onClick={() => setStep(2)} data-testid="button-next-step1">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Your details</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Where are we going?</p>
            <div style={{ display: "grid", gap: "1.25rem", marginBottom: "2rem" }}>
              <div>
                <label htmlFor="name">Full Name</label>
                <input id="name" className="input-field" placeholder="Your name" value={form.customerName} onChange={e => set("customerName", e.target.value)} data-testid="input-name" />
              </div>
              <div>
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" className="input-field" placeholder="(555) 000-0000" type="tel" value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)} data-testid="input-phone" />
              </div>
              <div>
                <label htmlFor="email">Email <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <input id="email" className="input-field" placeholder="you@email.com" type="email" value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)} data-testid="input-email" />
              </div>
              <div className="divider" style={{ margin: "0.25rem 0" }} />
              <div>
                <label htmlFor="pickup">Pickup Address</label>
                <input id="pickup" className="input-field" placeholder="123 Main St, Brooklyn, NY" value={form.pickupAddress} onChange={e => set("pickupAddress", e.target.value)} data-testid="input-pickup" />
              </div>
              <div>
                <label htmlFor="dropoff">Drop-off Address</label>
                <input id="dropoff" className="input-field" placeholder="456 Park Ave, Queens, NY" value={form.dropoffAddress} onChange={e => set("dropoffAddress", e.target.value)} data-testid="input-dropoff" />
              </div>
              {form.bookingType === "move" && (
                <div>
                  <label htmlFor="notes">Move Notes <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                  <textarea id="notes" className="input-field" placeholder="Apartment size, floor, elevator, heavy items..." rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} data-testid="input-notes" />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn-green" style={{ flex: 2, opacity: canNext2 ? 1 : 0.4 }} disabled={!canNext2} onClick={() => setStep(3)} data-testid="button-next-step2">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>When?</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Pick a date and time that works for you.</p>
            <div style={{ display: "grid", gap: "1.25rem", marginBottom: "2rem" }}>
              <div>
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  className="input-field"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.scheduledDate}
                  onChange={e => set("scheduledDate", e.target.value)}
                  data-testid="input-date"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label>Time</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  {/* Hour */}
                  <select
                    className="input-field"
                    style={{ textAlign: "center" }}
                    value={form.scheduledTime ? form.scheduledTime.split(":")[0] : ""}
                    onChange={e => {
                      const parts = form.scheduledTime ? form.scheduledTime.split(/:| /) : ["", "00", "PM"];
                      const min = parts[1] || "00";
                      const ampm = parts[2] || "PM";
                      set("scheduledTime", `${e.target.value}:${min} ${ampm}`);
                    }}
                    data-testid="select-hour"
                  >
                    <option value="">Hr</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <option key={h} value={String(h)}>{h}</option>
                    ))}
                  </select>
                  {/* Minute */}
                  <select
                    className="input-field"
                    style={{ textAlign: "center" }}
                    value={form.scheduledTime ? form.scheduledTime.split(/:| /)[1] : ""}
                    onChange={e => {
                      const parts = form.scheduledTime ? form.scheduledTime.split(/:| /) : ["12", "", "PM"];
                      const hr = parts[0] || "12";
                      const ampm = parts[2] || "PM";
                      set("scheduledTime", `${hr}:${e.target.value} ${ampm}`);
                    }}
                    data-testid="select-minute"
                  >
                    <option value="">Min</option>
                    {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {/* AM/PM */}
                  <select
                    className="input-field"
                    style={{ textAlign: "center" }}
                    value={form.scheduledTime ? form.scheduledTime.split(" ")[1] : "PM"}
                    onChange={e => {
                      const parts = form.scheduledTime ? form.scheduledTime.split(/:| /) : ["12", "00", ""];
                      const hr = parts[0] || "12";
                      const min = parts[1] || "00";
                      set("scheduledTime", `${hr}:${min} ${e.target.value}`);
                    }}
                    data-testid="select-ampm"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              {form.bookingType !== "move" && (
                <div>
                  <label htmlFor="notes2">Notes <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                  <textarea id="notes2" className="input-field" placeholder="Anything the driver should know..." rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} data-testid="input-notes2" />
                </div>
              )}
              <div className="card" style={{ background: "var(--surface-3)" }}>
                <p className="section-label" style={{ marginBottom: "0.75rem" }}>Booking Summary</p>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {[
                    ["Service", form.bookingType.charAt(0).toUpperCase() + form.bookingType.slice(1)],
                    ["Name", form.customerName],
                    ["Phone", form.customerPhone],
                    ["Pickup", form.pickupAddress],
                    ["Drop-off", form.dropoffAddress],
                    form.scheduledDate && ["Date", form.scheduledDate],
                    form.scheduledTime && ["Time", form.scheduledTime],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k as string} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{k}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button
                ref={confirmBtnRef}
                className="btn-green"
                style={{ flex: 2, opacity: canNext3 && !mutation.isPending ? 1 : 0.4 }}
                disabled={!canNext3 || mutation.isPending}
                onClick={() => mutation.mutate(form)}
                data-testid="button-confirm-booking"
              >
                {mutation.isPending ? "Booking..." : "Confirm Booking ✓"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
