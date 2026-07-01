import { useState } from "react";
import Nav from "@/components/Nav";
import { useQuery } from "@tanstack/react-query";

const BACKEND = "https://backend-production-507b.up.railway.app";

const POSITIONS = [
  {
    code: "FOC",
    title: "Founder Ops Customer",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.4)",
    price: 99.99,
    priceLabel: "$99.99 / yr",
    tiers: null,
    perks: ["12 ride credits/yr", "Priority booking", "No surge pricing", "Founding rate locked"],
  },
  {
    code: "DOF",
    title: "Driver Ops Founder",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.10)",
    border: "rgba(168,85,247,0.4)",
    price: 99.99,
    priceLabel: "$99.99 / yr",
    tiers: null,
    perks: ["90% revenue per job", "Founding driver position", "Priority job access", "Founding rate locked"],
  },
  {
    code: "BP",
    title: "Business Partnership",
    color: "#eab308",
    glow: "rgba(234,179,8,0.10)",
    border: "rgba(234,179,8,0.4)",
    price: null,
    priceLabel: "$99.99 – $499.99 / yr",
    tiers: [
      { name: "Small", desc: "1–5 employees", price: 99.99 },
      { name: "Mid", desc: "6–25 employees", price: 199.99 },
      { name: "Large", desc: "25+ / enterprise", price: 499.99 },
    ],
    perks: ["Early platform access", "Preferred API & ad pricing", "Direct operator line", "Referral revenue share"],
  },
];

type Step = "pick" | "details" | "payment" | "done";

export default function Join() {
  const [step, setStep] = useState<Step>("pick");
  const [position, setPosition] = useState<typeof POSITIONS[0] | null>(null);
  const [bpTier, setBpTier] = useState<{ name: string; price: number } | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [paymentRef, setPaymentRef] = useState("");

  // Capture referral code from URL: /#/join?ref=MEMBERID
  const referredBy = (() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const qs = hash.includes("?") ? hash.split("?")[1] : "";
    return new URLSearchParams(qs).get("ref") || null;
  })();

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    businessName: "", vehicleType: "", licenseNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const price = position?.code === "BP" ? bpTier?.price ?? 0 : position?.price ?? 0;
  const tierName = position?.code === "BP" ? bpTier?.name : undefined;

  const handleSubmitDetails = async () => {
    if (!position) return;
    setLoading(true); setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: position.code,
        tier: tierName ?? null,
        businessName: form.businessName.trim() || null,
        vehicleType: form.vehicleType.trim() || null,
        licenseNumber: form.licenseNumber.trim() || null,
        membershipPrice: String(price),
        paymentStatus: "pending",
        status: "pending_payment",
        referredBy: referredBy,
        joinedAt: new Date().toISOString(),
      };
      const res = await fetch(`${BACKEND}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register");
      setMemberId(data.id);
      setStep("payment");
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSent = () => {
    // Member claims they sent payment — move to done with pending status
    // Driver still needs to confirm on their end
    setStep("done");
  };

  const canDetails = form.name.trim() && form.email.trim() && form.phone.trim() &&
    (position?.code !== "BP" || !!form.businessName.trim()) &&
    (position?.code !== "DOF" || !!form.vehicleType.trim()) &&
    (position?.code !== "BP" || !!bpTier);

  const payMethods = [
    { key: "cashapp", label: "Cash App", icon: "💚" },
    { key: "venmo",   label: "Venmo",    icon: "💙" },
    { key: "paypal",  label: "PayPal",   icon: "💜" },
  ].filter(m => settings[m.key]);

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "2.5rem" }}>
          {(["pick", "details", "payment"] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: "3px", borderRadius: "999px",
              background: ["pick","details","payment","done"].indexOf(step) >= i
                ? (position?.color ?? "var(--green)") : "var(--border-color)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* ── STEP 1: Pick position ── */}
        {step === "pick" && (
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>
              Become a Founder
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "2rem" }}>
              Choose your position. Annual membership. Pay once, secure your place.
            </p>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {POSITIONS.map(p => (
                <div key={p.code}>
                  <div
                    onClick={() => { setPosition(p); setBpTier(null); }}
                    style={{
                      borderRadius: "0.9rem",
                      border: `1px solid ${position?.code === p.code ? p.border : "var(--border-color)"}`,
                      background: position?.code === p.code ? p.glow : "var(--surface-2)",
                      padding: "1.1rem 1.3rem",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: p.color, letterSpacing: "0.04em" }}>{p.code}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginLeft: "0.6rem" }}>{p.title}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: p.color, fontSize: "0.9rem", whiteSpace: "nowrap" }}>{p.priceLabel}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                      {p.perks.map(pk => (
                        <span key={pk} style={{
                          fontSize: "0.72rem", padding: "0.2rem 0.55rem",
                          borderRadius: "999px", background: `${p.color}18`,
                          color: p.color, fontWeight: 600,
                        }}>{pk}</span>
                      ))}
                    </div>
                  </div>

                  {/* BP tier selector */}
                  {position?.code === "BP" && p.code === "BP" && (
                    <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.5rem", paddingLeft: "0.5rem" }}>
                      {p.tiers!.map(t => (
                        <div
                          key={t.name}
                          onClick={() => setBpTier(t)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "0.7rem 1rem", borderRadius: "0.6rem",
                            border: `1px solid ${bpTier?.name === t.name ? p.border : "var(--border-color)"}`,
                            background: bpTier?.name === t.name ? p.glow : "var(--surface-3)",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.name}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>{t.desc}</span>
                          </div>
                          <span style={{ fontWeight: 800, color: p.color }}>${t.price.toFixed(2)} / yr</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              className="btn-green"
              style={{
                width: "100%", marginTop: "1.75rem",
                opacity: (position && (position.code !== "BP" || bpTier)) ? 1 : 0.4,
                background: position?.color ?? "var(--green)",
              }}
              disabled={!position || (position.code === "BP" && !bpTier)}
              onClick={() => setStep("details")}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === "details" && position && (
          <div>
            <button onClick={() => setStep("pick")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.25rem", padding: 0 }}>
              ← Back
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: position.color }}>{position.code}</span>
                {tierName && <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.85rem" }}>· {tierName}</span>}
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>{position.title}</p>
              </div>
              <span style={{ fontWeight: 800, color: position.color, fontSize: "1rem" }}>${price.toFixed(2)} / yr</span>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem" }}>Full Name</label>
                <input className="input-field" placeholder="Your full name" value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem" }}>Email</label>
                <input className="input-field" type="email" placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem" }}>Phone</label>
                <input className="input-field" type="tel" placeholder="Your phone number" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>

              {position.code === "BP" && (
                <div>
                  <label style={{ fontSize: "0.82rem" }}>Business Name</label>
                  <input className="input-field" placeholder="Your business name" value={form.businessName} onChange={e => set("businessName", e.target.value)} />
                </div>
              )}
              {position.code === "DOF" && (
                <>
                  <div>
                    <label style={{ fontSize: "0.82rem" }}>Vehicle Type</label>
                    <input className="input-field" placeholder="e.g. Sedan, SUV, Van" value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem" }}>License Plate</label>
                    <input className="input-field" placeholder="License plate number" value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {err && <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "0.75rem" }}>{err}</p>}

            <button
              className="btn-green"
              style={{ width: "100%", marginTop: "1.5rem", opacity: canDetails ? 1 : 0.4, background: position.color }}
              disabled={!canDetails || loading}
              onClick={handleSubmitDetails}
            >
              {loading ? "Saving..." : "Continue to Payment →"}
            </button>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === "payment" && position && (
          <div>
            <div style={{
              textAlign: "center", marginBottom: "2rem",
              padding: "1.75rem 1.5rem",
              background: position.glow,
              border: `1px solid ${position.border}`,
              borderRadius: "1rem",
            }}>
              <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💳</p>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>Send Your Membership Fee</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {position.code}{tierName ? ` · ${tierName}` : ""} — Annual Membership
              </p>
              <p style={{ fontSize: "2.2rem", fontWeight: 900, color: position.color, margin: "0.75rem 0 0", letterSpacing: "-0.03em" }}>
                ${price.toFixed(2)}
              </p>
            </div>

            {payMethods.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "2rem", marginBottom: "1.5rem" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Payment handles not set up yet. Contact us directly to complete your membership.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                  Send to any of these
                </p>
                {payMethods.map(m => (
                  <div key={m.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.9rem 1.1rem", borderRadius: "0.75rem",
                    background: "var(--surface-2)", border: "1px solid var(--border-color)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.3rem" }}>{m.icon}</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.label}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{settings[m.key]}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, color: position.color }}>${price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.82rem" }}>
                Transaction ID / Reference <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional but recommended)</span>
              </label>
              <input
                className="input-field"
                placeholder="Paste your payment reference or transaction ID"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                This helps confirm your payment faster.
              </p>
            </div>

            <button
              className="btn-green"
              style={{ width: "100%", background: position.color }}
              onClick={handleConfirmSent}
            >
              I Sent the Payment ✓
            </button>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === "done" && position && memberId && (
          <div style={{ textAlign: "center", paddingTop: "2rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              You're registered.
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "2rem", maxWidth: "380px", margin: "0 auto 2rem" }}>
              Your {position.code} membership is being verified. Once payment is confirmed you'll have full access to your founder dashboard.
            </p>

            <div style={{
              background: position.glow, border: `1px solid ${position.border}`,
              borderRadius: "1rem", padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem", textAlign: "left",
            }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Your Member ID</p>
              <p style={{ fontWeight: 900, fontSize: "1.5rem", color: position.color, letterSpacing: "-0.02em" }}>#{memberId}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>Save this. You'll use it to access your dashboard.</p>
            </div>

            <a
              href={`/#/member/${memberId}`}
              style={{
                display: "block", width: "100%", textAlign: "center",
                padding: "0.85rem", borderRadius: "0.6rem",
                background: position.color, color: "#000",
                fontWeight: 800, fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Go to My Dashboard →
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
