import { useState, useEffect } from "react";

const BACKEND = "https://backend-production-507b.up.railway.app";

type Props = { onAuth: (driverId?: number) => void };

const VEHICLE_TYPES = ["Sedan", "SUV", "Van", "Truck", "Minivan", "Other"];

const PERKS = [
  { icon: "💰", label: "90% Revenue Per Job", sub: "Keep more of what you earn — every single job." },
  { icon: "📅", label: "You Set Your Schedule", sub: "Work when you want. No minimums, no shifts." },
  { icon: "🚀", label: "Founding Driver Rate", sub: "Lock in your rate before prices change. Forever." },
  { icon: "🌐", label: "Early Platform Access", sub: "Founding drivers get access before the platform opens to the public." },
];

export default function DriverLogin({ onAuth }: Props) {
  const [mode, setMode] = useState<"landing" | "signin" | "register">("landing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPin, setSiPin] = useState("");

  // Legacy owner PIN
  const [ownerPin, setOwnerPin] = useState("");
  const [hasOwnerPin, setHasOwnerPin] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regVehicle, setRegVehicle] = useState("");
  const [regLicense, setRegLicense] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  useEffect(() => {
    fetch(`${BACKEND}/api/settings`)
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setHasOwnerPin(!!data.driver_pin);
        setPinChecked(true);
      })
      .catch(() => setPinChecked(true));
  }, []);

  const handleSignIn = async () => {
    setError("");
    if (!siEmail.trim() || !siPin.trim()) { setError("Enter your email and PIN."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/drivers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: siEmail.trim(), pin: siPin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Sign in failed."); setLoading(false); return; }
      onAuth(data.id);
    } catch { setError("Connection error. Try again."); }
    setLoading(false);
  };

  const handleOwnerPin = async () => {
    setError("");
    if (!ownerPin.trim()) return;
    setLoading(true);
    const data: Record<string, string> = await fetch(`${BACKEND}/api/settings`)
      .then(r => r.json()).catch(() => ({}));
    if (ownerPin.trim() === data.driver_pin) { onAuth(); } else { setError("Incorrect PIN."); }
    setLoading(false);
  };

  const handleRegister = async () => {
    setError("");
    if (!regName || !regEmail || !regPhone || !regVehicle || !regLicense || !regPin) {
      setError("All fields are required."); return;
    }
    if (regPin.length < 4) { setError("PIN must be at least 4 characters."); return; }
    if (regPin !== regConfirm) { setError("PINs don't match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/drivers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(), email: regEmail.trim(), phone: regPhone.trim(),
          vehicleType: regVehicle, licenseNumber: regLicense.trim(), pin: regPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      setSuccess(`Your Driver ID is #${data.id}. Once reviewed, you'll be activated and ready to take jobs.`);
    } catch { setError("Connection error. Try again."); }
    setLoading(false);
  };

  // ── LANDING / RECRUITMENT ──────────────────────────────────────────────
  if (mode === "landing") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

        {/* Hero */}
        <div style={{
          padding: "4rem 2rem 3rem",
          textAlign: "center",
          borderBottom: "1px solid var(--border-color)",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.35rem 0.9rem", borderRadius: "999px",
            border: "1px solid rgba(34,197,94,0.35)",
            background: "rgba(34,197,94,0.08)",
            marginBottom: "1.5rem",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, letterSpacing: "0.06em" }}>NOW RECRUITING · FOUNDING DRIVERS</span>
          </div>

          <h1 style={{
            fontFamily: "'Cabinet Grotesk', sans-serif",
            fontSize: "clamp(2rem, 6vw, 3.25rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.25rem",
          }}>
            Drive with{" "}
            <span style={{ background: "linear-gradient(90deg, #22c55e, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              DLIVAH-AYH
            </span>
          </h1>

          <p style={{
            color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.65,
            maxWidth: "520px", margin: "0 auto 2rem",
          }}>
            Greater Hartford, Connecticut. Rides, moves, and deliveries. Become a founding driver and lock in your rate before the platform opens to the public.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn-green"
              style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", fontWeight: 800 }}
              onClick={() => setMode("register")}
            >
              Apply as a Driver
            </button>
            <button
              onClick={() => setMode("signin")}
              style={{
                padding: "0.75rem 1.75rem", fontSize: "0.88rem",
                background: "transparent", border: "1px solid var(--border-color)",
                borderRadius: "0.6rem", color: "var(--text-muted)",
                cursor: "pointer", fontFamily: "'Satoshi', sans-serif", fontWeight: 500,
              }}
            >
              Already have an account
            </button>
          </div>
        </div>

        {/* DOF callout */}
        <div style={{
          margin: "2.5rem auto 0", width: "100%", maxWidth: "720px",
          padding: "0 1.5rem",
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(34,197,94,0.04))",
            border: "1px solid rgba(168,85,247,0.25)",
            borderRadius: "1rem", padding: "1.5rem 1.75rem",
            marginBottom: "2rem",
          }}>
            <p style={{ fontSize: "0.72rem", color: "#a855f7", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
              DOF — DRIVER OPS FOUNDER
            </p>
            <p style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.35rem" }}>
              $99.99 / year · Founding membership
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              Founding drivers lock in the founding rate and earn 90% revenue on every job. Annual renewal. Benefits are limited to preserve the infrastructure.
            </p>
          </div>

          {/* Perks grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem", marginBottom: "3rem" }}>
            {PERKS.map(p => (
              <div key={p.label} className="card" style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>{p.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.2rem" }}>{p.label}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.5 }}>{p.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", paddingBottom: "3rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
              Spots are limited. Founding driver rates close when the platform launches publicly.
            </p>
            <button
              className="btn-purple"
              style={{ padding: "0.75rem 2.25rem", fontSize: "0.92rem", fontWeight: 800 }}
              onClick={() => setMode("register")}
            >
              Join as a Founding Driver →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SHARED CARD WRAPPER ────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", background: "var(--bg)",
      backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 70%)",
    }}>
      <div style={{
        width: "100%", maxWidth: "400px",
        background: "var(--surface-2)",
        border: "1px solid var(--border-color)",
        borderRadius: "1.25rem",
        padding: "2rem 2rem 2.25rem",
        boxShadow: "0 0 40px rgba(168,85,247,0.08)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <button
            onClick={() => { setMode("landing"); setError(""); setSuccess(""); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", padding: 0, lineHeight: 1 }}
          >←</button>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.01em" }}>
              {mode === "signin" ? "Sign In" : "Apply as a Driver"}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.1rem" }}>DLIVAH-AYH Driver Portal</p>
          </div>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
          }}>🚗</div>
        </div>

        {/* ── SIGN IN ── */}
        {mode === "signin" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Email</label>
              <input className="input-field" type="email" placeholder="your@email.com"
                value={siEmail} autoFocus
                onChange={e => { setSiEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSignIn()} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>PIN</label>
              <input className="input-field" type="password" placeholder="Your PIN"
                value={siPin}
                onChange={e => { setSiPin(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSignIn()} />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}
            <button className="btn-green" style={{ width: "100%", marginTop: "0.25rem", opacity: loading ? 0.6 : 1 }}
              onClick={handleSignIn} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {hasOwnerPin && pinChecked && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>or owner PIN</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem" }}>Owner PIN</label>
                  <input className="input-field" type="password" placeholder="Admin PIN"
                    value={ownerPin}
                    onChange={e => { setOwnerPin(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleOwnerPin()} />
                </div>
                <button className="btn-purple" style={{ width: "100%", opacity: loading ? 0.6 : 1 }}
                  onClick={handleOwnerPin} disabled={loading || !ownerPin.trim()}>
                  {loading ? "Checking…" : "Enter with Owner PIN"}
                </button>
              </>
            )}

            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Don't have an account?{" "}
              <button onClick={() => { setMode("register"); setError(""); }}
                style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", padding: 0 }}>
                Apply here
              </button>
            </p>
          </div>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {mode === "register" && !success && (
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Full Name</label>
              <input className="input-field" placeholder="Your full name" value={regName} autoFocus
                onChange={e => { setRegName(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Email</label>
              <input className="input-field" type="email" placeholder="your@email.com" value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Phone</label>
              <input className="input-field" type="tel" placeholder="(860) 000-0000" value={regPhone}
                onChange={e => { setRegPhone(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Vehicle Type</label>
              <select className="input-field" value={regVehicle}
                onChange={e => { setRegVehicle(e.target.value); setError(""); }}
                style={{ appearance: "none", cursor: "pointer" }}>
                <option value="">Select vehicle…</option>
                {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>License / Plate Number</label>
              <input className="input-field" placeholder="License or plate number" value={regLicense}
                onChange={e => { setRegLicense(e.target.value); setError(""); }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem" }}>Create PIN</label>
                <input className="input-field" type="password" placeholder="Min 4 chars" value={regPin}
                  onChange={e => { setRegPin(e.target.value); setError(""); }} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem" }}>Confirm PIN</label>
                <input className="input-field" type="password" placeholder="Repeat PIN" value={regConfirm}
                  onChange={e => { setRegConfirm(e.target.value); setError(""); }} />
              </div>
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}

            {/* DOF membership callout */}
            <div style={{
              padding: "0.9rem 1rem", borderRadius: "0.65rem",
              background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)",
            }}>
              <p style={{ fontSize: "0.78rem", color: "#a855f7", fontWeight: 700, marginBottom: "0.2rem" }}>DOF Founding Membership · $99.99/yr</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                90% revenue per job · Founding driver rate · Annual renewal
              </p>
            </div>

            <button className="btn-purple" style={{ width: "100%", opacity: loading ? 0.6 : 1 }}
              onClick={handleRegister} disabled={loading}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
            <p style={{ color: "var(--text-muted)", fontSize: "0.73rem", textAlign: "center", lineHeight: 1.5 }}>
              Your account will be reviewed before activation.
            </p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {mode === "register" && success && (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>Application Submitted</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", lineHeight: 1.65 }}>{success}</p>
            <button className="btn-green" style={{ width: "100%", marginTop: "1.5rem" }}
              onClick={() => { setMode("signin"); setSuccess(""); setError(""); }}>
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
