import { useState, useEffect, useRef, useCallback } from "react";
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

// ── Nominatim geocode search ──────────────────────────────────────────────
async function searchAddress(query: string): Promise<Array<{ display: string; lat: number; lon: number }>> {
  if (query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query + " Connecticut")}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.map((r: any) => ({ display: r.display_name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }));
}

// ── Reverse geocode from lat/lon ──────────────────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

// ── OSRM driving distance ─────────────────────────────────────────────────
async function getDrivingDistance(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number
): Promise<{ distanceMiles: number; durationMin: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const meters = data.routes[0].distance;
    const seconds = data.routes[0].duration;
    return { distanceMiles: meters / 1609.344, durationMin: Math.ceil(seconds / 60) };
  } catch {
    return null;
  }
}

// ── Price calculator ──────────────────────────────────────────────────────
function calcPrice(miles: number, baseFare: number, perMile: number): number {
  return Math.max(baseFare, baseFare + miles * perMile);
}

// ── Address autocomplete input ────────────────────────────────────────────
function AddressInput({
  id, label, value, placeholder, onSelect, testId,
  showGps = false,
}: {
  id: string; label: string; value: string; placeholder: string;
  onSelect: (display: string, lat: number, lon: number) => void;
  testId: string; showGps?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Array<{ display: string; lat: number; lon: number }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep query in sync with external value (e.g. GPS fill)
  useEffect(() => { setQuery(value); }, [value]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchAddress(val);
      setResults(res);
      setOpen(res.length > 0);
      setLoading(false);
    }, 350);
  };

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        onSelect(addr, pos.coords.latitude, pos.coords.longitude);
        setQuery(addr);
        setOpen(false);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <label htmlFor={id} style={{ margin: 0 }}>{label}</label>
        {showGps && (
          <button
            type="button"
            onClick={handleGps}
            title="Use my current location"
            style={{
              background: "none", border: "1px solid var(--green)", borderRadius: "0.35rem",
              padding: "0.15rem 0.5rem", fontSize: "0.72rem", color: "var(--green)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            {gpsLoading ? "⏳" : "📍"} {gpsLoading ? "Locating..." : "Use GPS"}
          </button>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          className="input-field"
          placeholder={placeholder}
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          autoComplete="off"
          data-testid={testId}
        />
        {loading && (
          <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Searching...
          </span>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "var(--surface-2)", border: "1px solid var(--border-color)",
          borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          marginTop: "2px",
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => {
                onSelect(r.display, r.lat, r.lon);
                setQuery(r.display);
                setOpen(false);
              }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "0.65rem 0.9rem", background: "none", border: "none",
                borderBottom: i < results.length - 1 ? "1px solid var(--border-color)" : "none",
                cursor: "pointer", fontSize: "0.82rem", lineHeight: 1.4,
                color: "var(--text)",
              }}
            >
              📍 {r.display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Book() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  // Rate config from settings (driver can set in portal), defaults to Hartford rates
  const BASE_FARE = parseFloat(settings.base_fare || "5.00");
  const PER_MILE = parseFloat(settings.rate_per_mile || "1.75");

  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const preType = params.get("type") || "";

  const [step, setStep] = useState(1);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (step === 3) {
      setTimeout(() => confirmBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
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

  // Geo coords for both addresses
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Route result
  const [route, setRoute] = useState<{ distanceMiles: number; durationMin: number; price: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Recalculate route whenever both coords are set
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) { setRoute(null); return; }
    setRouteLoading(true);
    getDrivingDistance(pickupCoords.lat, pickupCoords.lon, dropoffCoords.lat, dropoffCoords.lon)
      .then(res => {
        if (res) {
          setRoute({ ...res, price: calcPrice(res.distanceMiles, BASE_FARE, PER_MILE) });
        } else {
          setRoute(null);
        }
        setRouteLoading(false);
      });
  }, [pickupCoords, dropoffCoords, BASE_FARE, PER_MILE]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/bookings", {
        ...data,
        estimatedPrice: route ? `$${route.price.toFixed(2)}` : null,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      return res.json();
    },
    onSuccess: (data: any) => { setConfirmed(true); setBookingId(data?.id || null); },
    onError: () => toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" }),
  });

  const canNext1 = form.bookingType !== "";
  const canNext2 = form.customerName && form.customerPhone && form.pickupAddress && form.dropoffAddress;
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

  const resetForm = () => {
    setConfirmed(false); setStep(1); setBookingId(null);
    setForm({ bookingType: "", customerName: "", customerPhone: "", customerEmail: "", pickupAddress: "", dropoffAddress: "", scheduledDate: "", scheduledTime: "", notes: "" });
    setPickupCoords(null); setDropoffCoords(null); setRoute(null);
  };

  // ── Confirmation screen ─────────────────────────────────────────────────
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
                route ? ["Distance", `${route.distanceMiles.toFixed(1)} mi · ~${route.durationMin} min`] : null,
                route ? ["Estimated Fare", `$${route.price.toFixed(2)}`] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k as string} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{k}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: k === "Estimated Fare" ? 800 : 600, textAlign: "right", color: k === "Estimated Fare" ? "var(--green)" : undefined }}>{v}</span>
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
              {route && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
                  Estimated fare: <strong style={{ color: "var(--green)" }}>${route.price.toFixed(2)}</strong> · Send exact amount as reference
                </p>
              )}
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
          <button className="btn-green" style={{ width: "100%" }} onClick={resetForm}>
            Book Another
          </button>
        </div>
      </div>
    );
  }

  // ── Booking steps ───────────────────────────────────────────────────────
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
                {["Service", "Route & Price", "Schedule"][s - 1]}
              </span>
              {s < 3 && <div style={{ flex: 1, height: "1px", width: "30px", background: step > s ? "var(--green)" : "var(--border-color)" }} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Service ── */}
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

        {/* ── Step 2: Details + Route + Price ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Route & Price</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Enter your pickup and drop-off — we'll calculate your fare instantly.</p>
            <div style={{ display: "grid", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div>
                <label htmlFor="name">Full Name</label>
                <input id="name" className="input-field" placeholder="Your name" value={form.customerName} onChange={e => set("customerName", e.target.value)} data-testid="input-name" />
              </div>
              <div>
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" className="input-field" placeholder="(860) 000-0000" type="tel" value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)} data-testid="input-phone" />
              </div>
              <div>
                <label htmlFor="email">Email <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <input id="email" className="input-field" placeholder="you@email.com" type="email" value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)} data-testid="input-email" />
              </div>

              <div style={{ margin: "0.25rem 0", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>📍 Your Route</p>

                <div style={{ display: "grid", gap: "1rem" }}>
                  <AddressInput
                    id="pickup"
                    label="Pickup Address"
                    value={form.pickupAddress}
                    placeholder="Search address or use GPS..."
                    showGps={true}
                    testId="input-pickup"
                    onSelect={(display, lat, lon) => {
                      set("pickupAddress", display);
                      setPickupCoords({ lat, lon });
                    }}
                  />
                  <AddressInput
                    id="dropoff"
                    label="Drop-off Address"
                    value={form.dropoffAddress}
                    placeholder="Where are you going?"
                    testId="input-dropoff"
                    onSelect={(display, lat, lon) => {
                      set("dropoffAddress", display);
                      setDropoffCoords({ lat, lon });
                    }}
                  />
                </div>
              </div>

              {/* ── Live price card ── */}
              {(pickupCoords || dropoffCoords) && (
                <div style={{
                  borderRadius: "0.75rem", overflow: "hidden",
                  border: route ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--border-color)",
                  background: "var(--surface-3)",
                }}>
                  {routeLoading ? (
                    <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                      ⏳ Calculating route...
                    </div>
                  ) : route ? (
                    <div style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.2rem" }}>Estimated Fare</p>
                          <p style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--green)", lineHeight: 1 }}>${route.price.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.2rem" }}>Route</p>
                          <p style={{ fontSize: "1rem", fontWeight: 700 }}>{route.distanceMiles.toFixed(1)} mi</p>
                          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>~{route.durationMin} min drive</p>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
                        ${BASE_FARE.toFixed(2)} base + ${PER_MILE.toFixed(2)}/mi · Final fare confirmed by driver
                      </div>
                    </div>
                  ) : (pickupCoords && dropoffCoords) ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Could not calculate route — driver will confirm fare
                    </div>
                  ) : (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Set both addresses to see your fare
                    </div>
                  )}
                </div>
              )}

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
                {route ? `Continue · $${route.price.toFixed(2)} →` : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Schedule ── */}
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
                  <select
                    className="input-field"
                    style={{ textAlign: "center" }}
                    value={form.scheduledTime ? form.scheduledTime.split(":")[0] : ""}
                    onChange={e => {
                      const parts = form.scheduledTime ? form.scheduledTime.split(/:| /) : ["", "00", "PM"];
                      set("scheduledTime", `${e.target.value}:${parts[1] || "00"} ${parts[2] || "PM"}`);
                    }}
                    data-testid="select-hour"
                  >
                    <option value="">Hr</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={String(h)}>{h}</option>)}
                  </select>
                  <select
                    className="input-field"
                    style={{ textAlign: "center" }}
                    value={form.scheduledTime ? form.scheduledTime.split(/:| /)[1] : ""}
                    onChange={e => {
                      const parts = form.scheduledTime ? form.scheduledTime.split(/:| /) : ["12", "", "PM"];
                      set("scheduledTime", `${parts[0] || "12"}:${e.target.value} ${parts[2] || "PM"}`);
                    }}
                    data-testid="select-minute"
                  >
                    <option value="">Min</option>
                    {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    className="input-field"
                    style={{ textAlign: "center" }}
                    value={form.scheduledTime ? form.scheduledTime.split(" ")[1] : "PM"}
                    onChange={e => {
                      const parts = form.scheduledTime ? form.scheduledTime.split(/:| /) : ["12", "00", ""];
                      set("scheduledTime", `${parts[0] || "12"}:${parts[1] || "00"} ${e.target.value}`);
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

              {/* Booking summary with fare */}
              <div className="card" style={{ background: "var(--surface-3)" }}>
                <p className="section-label" style={{ marginBottom: "0.75rem" }}>Booking Summary</p>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {[
                    ["Service", form.bookingType.charAt(0).toUpperCase() + form.bookingType.slice(1)],
                    ["Name", form.customerName],
                    ["Pickup", form.pickupAddress],
                    ["Drop-off", form.dropoffAddress],
                    route ? ["Distance", `${route.distanceMiles.toFixed(1)} mi · ~${route.durationMin} min`] : null,
                    form.scheduledDate ? ["Date", form.scheduledDate] : null,
                    form.scheduledTime ? ["Time", form.scheduledTime] : null,
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k as string} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{k}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                    </div>
                  ))}
                </div>
                {route && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Estimated Fare</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--green)" }}>${route.price.toFixed(2)}</span>
                  </div>
                )}
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
                {mutation.isPending ? "Booking..." : route ? `Confirm · $${route.price.toFixed(2)} ✓` : "Confirm Booking ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
