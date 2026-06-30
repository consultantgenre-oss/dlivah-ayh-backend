import { useState } from "react";
import Nav from "@/components/Nav";

const FOUNDERS = [
  {
    code: "FOC",
    title: "Founder Ops Customer",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.35)",
    price: "$99.99 / yr",
    hook: "You ride outside the conventional system.",
    why: "FOC status means you were here first. You stepped into the network before it was open to everyone. That puts you in a founding position — not a customer position. The conventional system charges you based on demand, time of day, weather, and algorithms you have no say in. Founder status removes that. You pay a set annual membership and gain access to service that doesn't surge, doesn't deprioritize you, and doesn't treat you like a transaction.",
    benefits: [
      "Non-conventional pricing — no surge, no algorithm",
      "Priority booking — you're always first in line",
      "12 domestic ride credits per year — credited to your account",
      "Founding rate locked at time of membership",
      "Referral & affiliate earnings",
      "Annual renewal — your price, your benefit",
    ],
    cta: "Become a FOC Founder",
  },
  {
    code: "DOF",
    title: "Driver Ops Founder",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.35)",
    price: "$99.99 / yr",
    hook: "You operate. You earn. You hold your position.",
    why: "DOF status means you're not driving for a platform that takes 30–40% and decides your fate with a rating. You drive as a founder. You operate under a structure built to keep more money in your hands. 90% of every job goes to you. Your membership covers your place in the network — not a subscription to someone else's rules.",
    benefits: [
      "90% revenue per job — you keep what you earn",
      "Non-conventional driver rate — not platform-controlled",
      "Founding driver position in the AYH network",
      "Priority job access",
      "Annual renewal at founding rate",
    ],
    cta: "Become a DOF Founder",
  },
  {
    code: "BP",
    title: "Business Partnership Founder",
    color: "#eab308",
    glow: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.35)",
    price: "$99.99 – $499.99 / yr",
    hook: "Your business steps out of the conventional logistics system.",
    why: "BP status connects your business to the AYH network as a founding partner. You're not paying per delivery or per ride at rates a platform sets for you. You're in the network at a fixed annual membership that gives your business direct access to the service, early access to new platform features, and preferred API and advertising pricing as the platform grows. The tier you choose reflects your operation — all three tiers step outside conventional business service costs.",
    benefits: [
      "Early access to new platform features — before general release",
      "Preferred API & advertising pricing",
      "Business account & direct scheduling",
      "Referral revenue share",
      "Direct operator line",
      "Annual renewal",
    ],
    tiers: [
      { name: "Small", price: "$99.99 / yr", desc: "1–5 employees" },
      { name: "Mid", price: "$199.99 / yr", desc: "6–25 employees" },
      { name: "Large", price: "$499.99 / yr", desc: "25+ / enterprise" },
    ],
    cta: "Become a BP Founder",
  },
];

export default function Pricing() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "620px", margin: "3rem auto", padding: "0 1.5rem 6rem" }}>

        {/* Header */}
        <h1 style={{ fontSize: "2rem", letterSpacing: "-0.03em", marginBottom: "0.6rem", fontWeight: 800 }}>
          Become a Founder
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
          Annual membership. Opens all benefit — non-conventional, get priority booking, no surge prices.
          Prices may change. Benefits are limited to preserve the infrastructure.
        </p>

        {/* Founder cards */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {FOUNDERS.map(f => {
            const isOpen = open === f.code;
            return (
              <div
                key={f.code}
                id={f.code.toLowerCase()}
                style={{
                  borderRadius: "1rem",
                  border: `1px solid ${isOpen ? f.border : "var(--border-color)"}`,
                  background: isOpen ? f.glow : "var(--surface-2)",
                  boxShadow: isOpen ? `0 0 24px ${f.glow}` : "none",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                {/* Row — always visible */}
                <div
                  onClick={() => setOpen(isOpen ? null : f.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.2rem 1.4rem",
                    cursor: "pointer",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", color: f.color, display: "block", letterSpacing: "0.04em" }}>
                        {f.code}
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{f.title}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: f.color, whiteSpace: "nowrap" }}>{f.price}</span>
                    <span style={{
                      display: "inline-block",
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                    }}>▼</span>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: "0 1.4rem 1.6rem", borderTop: `1px solid ${f.border}` }}>
                    {/* Hook */}
                    <p style={{ fontWeight: 700, fontSize: "1rem", marginTop: "1.2rem", marginBottom: "0.75rem", color: f.color }}>
                      {f.hook}
                    </p>

                    {/* Why */}
                    <p style={{ color: "var(--text-muted)", fontSize: "0.87rem", lineHeight: 1.75, marginBottom: "1.25rem" }}>
                      {f.why}
                    </p>

                    {/* Benefits */}
                    <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                      What you get
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "grid", gap: "0.5rem" }}>
                      {f.benefits.map(b => (
                        <li key={b} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.87rem" }}>
                          <span style={{ color: f.color, marginTop: "0.1rem", flexShrink: 0 }}>✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {/* BP tiers */}
                    {f.tiers && (
                      <>
                        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                          Choose your tier
                        </p>
                        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.25rem" }}>
                          {f.tiers.map(t => (
                            <div key={t.name} style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "0.7rem 1rem", borderRadius: "0.6rem",
                              background: "var(--surface-3)", border: "1px solid var(--border-color)",
                              fontSize: "0.87rem",
                            }}>
                              <div>
                                <span style={{ fontWeight: 700 }}>{t.name}</span>
                                <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>{t.desc}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: f.color }}>{t.price}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* CTA */}
                    <a
                      href="/#/join"
                      style={{
                        display: "block", width: "100%", textAlign: "center",
                        padding: "0.85rem", borderRadius: "0.6rem",
                        background: f.color, color: "#000",
                        fontWeight: 800, fontSize: "0.9rem",
                        textDecoration: "none", letterSpacing: "0.01em",
                        transition: "opacity 0.15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                    >
                      {f.cta}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
