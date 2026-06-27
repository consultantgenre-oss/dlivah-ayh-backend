import { useState, useEffect } from "react";

const BACKEND = "https://backend-production-507b.up.railway.app";

type Props = { onAuth: (driverId?: number) => void };

const VEHICLE_TYPES = ["Sedan", "SUV", "Van", "Truck", "Minivan", "Other"];

export default function DriverLogin({ onAuth }: Props) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPin, setSiPin] = useState("");

  // Also keep legacy owner PIN support (single-driver mode)
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

  // On mount: check if owner PIN is set (legacy single-driver)
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
    } catch {
      setError("Connection error. Try again.");
    }
    setLoading(false);
  };

  // Legacy owner PIN login (keeps existing owner access)
  const handleOwnerPin = async () => {
    setError("");
    if (!ownerPin.trim()) return;
    setLoading(true);
    const data: Record<string, string> = await fetch(`${BACKEND}/api/settings`)
      .then(r => r.json()).catch(() => ({}));
    if (ownerPin.trim() === data.driver_pin) {
      onAuth();
    } else {
      setError("Incorrect PIN.");
    }
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
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          vehicleType: regVehicle,
          licenseNumber: regLicense.trim(),
          pin: regPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      setSuccess(`Account created! Your Driver ID is #${data.id}. A confirmation will be sent once your account is reviewed.`);
    } catch {
      setError("Connection error. Try again.");
    }
    setLoading(false);
  };

  const card: React.CSSProperties = {
    width: "100%", maxWidth: "400px",
    background: "var(--surface-2)",
    border: "1px solid var(--border-color)",
    borderRadius: "1.25rem",
    padding: "2rem 2rem 2.25rem",
    boxShadow: "0 0 40px rgba(168,85,247,0.08)",
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "0.55rem 0",
    border: "none",
    borderRadius: "0.55rem",
    background: active ? (mode === "signin" ? "var(--green)" : "var(--purple)") : "transparent",
    color: active ? "#000" : "var(--text-muted)",
    fontWeight: active ? 700 : 500,
    fontSize: "0.85rem", cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Satoshi', sans-serif",
  });

  if (!pinChecked) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", background: "var(--bg)",
    }}>
      <div style={card}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #a855f7)",
            margin: "0 auto 1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem",
          }}>🚗</div>
          <p style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>Driver Portal</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>DLIVAH-AYH</p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", gap: "0.3rem",
          background: "var(--surface-3)", borderRadius: "0.7rem",
          padding: "0.25rem", marginBottom: "1.75rem",
        }}>
          <button style={tabBtn(mode === "signin")} onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>
            Sign In
          </button>
          <button style={{ ...tabBtn(mode === "register"), color: mode === "register" ? "#fff" : "var(--text-muted)" }}
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>
            Create Account
          </button>
        </div>

        {/* ── SIGN IN ── */}
        {mode === "signin" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="your@email.com"
                value={siEmail}
                autoFocus
                onChange={e => { setSiEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSignIn()}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>PIN</label>
              <input
                className="input-field"
                type="password"
                placeholder="Your PIN"
                value={siPin}
                onChange={e => { setSiPin(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSignIn()}
              />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}
            <button
              className="btn-green"
              style={{ width: "100%", marginTop: "0.25rem", opacity: loading ? 0.6 : 1 }}
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* Owner / admin PIN divider */}
            {hasOwnerPin && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>or owner PIN</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem" }}>Owner PIN</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Admin PIN"
                    value={ownerPin}
                    onChange={e => { setOwnerPin(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleOwnerPin()}
                  />
                </div>
                <button
                  className="btn-purple"
                  style={{ width: "100%", opacity: loading ? 0.6 : 1 }}
                  onClick={handleOwnerPin}
                  disabled={loading || !ownerPin.trim()}
                >
                  {loading ? "Checking…" : "Enter with Owner PIN"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {mode === "register" && !success && (
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Full Name</label>
              <input className="input-field" placeholder="Your full name" value={regName}
                autoFocus onChange={e => { setRegName(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Email</label>
              <input className="input-field" type="email" placeholder="your@email.com" value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Phone</label>
              <input className="input-field" type="tel" placeholder="(718) 000-0000" value={regPhone}
                onChange={e => { setRegPhone(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Vehicle Type</label>
              <select
                className="input-field"
                value={regVehicle}
                onChange={e => { setRegVehicle(e.target.value); setError(""); }}
                style={{ appearance: "none", cursor: "pointer" }}
              >
                <option value="">Select vehicle type…</option>
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
            <button
              className="btn-purple"
              style={{ width: "100%", marginTop: "0.25rem", opacity: loading ? 0.6 : 1 }}
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center", lineHeight: 1.5 }}>
              Your account will be reviewed before activation.
            </p>
          </div>
        )}

        {/* ── SUCCESS STATE ── */}
        {mode === "register" && success && (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>Account Submitted</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", lineHeight: 1.6 }}>{success}</p>
            <button
              className="btn-green"
              style={{ width: "100%", marginTop: "1.5rem" }}
              onClick={() => { setMode("signin"); setSuccess(""); setError(""); }}
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
