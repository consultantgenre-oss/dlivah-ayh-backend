import { useState } from "react";
import { Link } from "wouter";
import Nav from "@/components/Nav";

const plans = [
  {
    code: "FOC",
    label: "Founder Ops Customer",
    price: 99.99,
    color: "var(--green)",
    glow: "var(--green-glow)",
    border: "rgba(34,197,94,0.3)",
    why: "You were here first. That puts you in a different category. Founding price, founding access — benefits are limited to preserve the infrastructure.",
    benefits: [
      "12 domestic ride credits per year — credited to your account",
      "Founding price — not the conventional rate",
      "First in line for every service",
      "Referral & affiliate earnings",
      "Annual renewal",
      "Benefits are limited to preserve the infrastructure",
    ],
  },
  {
    code: "DOF",
    label: "Driver Ops Founder",
    price: 99.99,
    color: "var(--purple)",
    glow: "var(--purple-glow)",
    border: "rgba(168,85,247,0.3)",
    why: "Your membership activates your access to the job flow. In return, 90% of every job goes directly to you. The membership is what keeps the platform running so you keep earning.",
    benefits: [
      "90% of every completed job — yours",
      "Full access to job dispatch",
      "Founding driver rate",
      "Annual renewal",
    ],
  },
  {
    code: "BP",
    label: "Business Partnership Founder",
    price: null,
    color: "#eab308",
    glow: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.3)",
    why: "Your tier connects your business to the AYH network. Every tier gets early access to new platform features before anyone else, plus preferred pricing on API and advertising — better rates as the platform scales.",
    tiers: [
      {
        name: "Small",
        price: 99.99,
        desc: "1–5 employees",
        benefits: [
          "Business account & scheduling",
          "Early access to new platform features",
          "Preferred API & ad pricing",
          "Referral revenue share",
          "Direct operator line",
          "Annual renewal",
        ],
      },
      {
        name: "Mid",
        price: 199.99,
        desc: "6–25 employees",
        benefits: [
          "Everything in Small",
          "Bulk booking access",
          "Priority dispatch",
          "Enhanced API & ad rates",
          "Annual renewal",
        ],
      },
      {
        name: "Large",
        price: 499.99,
        desc: "25+ / enterprise",
        benefits: [
          "Everything in Mid",
          "Enterprise account management",
          "Dedicated scheduling line",
          "Top-tier API & ad pricing",
          "Annual renewal",
        ],
      },
    ],
  },
];

export default function Pricing() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "0 1.5rem 6rem" }}>
        <h1 style={{ fontSize: "1.6rem", letterSpacing: "-0.02em", marginBottom: "0.4rem" }}>Pricing</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "2.5rem" }}>
          Annual membership. You pay for your benefit — that's what you own. Prices may change. Benefits are limited to preserve the infrastructure.
        </p>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {plans.map(plan => (
            <div key={plan.code}>
              <div
                className="card"
                data-testid={`plan-${plan.code}`}
                onClick={() => setOpen(open === plan.code ? null : plan.code)}
                style={{
                  cursor: "pointer",
                  border: `1px solid ${open === plan.code ? plan.border : "var(--border-color)"}`,
                  boxShadow: open === plan.code ? `0 0 18px ${plan.glow}` : "none",
                  transition: "all 0.15s",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, color: plan.color, fontSize: "1rem" }}>{plan.code}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{plan.label}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {plan.price !== null ? (
                      <>
                        <p style={{ fontWeight: 800, fontSize: "1.2rem", color: plan.color }}>${plan.price}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>per year</p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontWeight: 800, fontSize: "1rem", color: plan.color }}>$99–$499</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>per year</p>
                      </>
                    )}
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: "0.25rem" }}>
                    {open === plan.code ? "▲" : "▼"}
                  </span>
                </div>

                {/* Expanded */}
                {open === plan.code && (
                  <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color)" }}>
                    {/* Why */}
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "1.25rem" }}>
                      {plan.why}
                    </p>

                    {/* Non-BP benefits */}
                    {plan.benefits && (
                      <ul style={{ display: "grid", gap: "0.4rem", marginBottom: "1.25rem" }}>
                        {plan.benefits.map(b => (
                          <li key={b} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            <span style={{ color: plan.color, flexShrink: 0 }}>✓</span> {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* BP tiers */}
                    {plan.tiers && (
                      <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.25rem" }}>
                        {plan.tiers.map(t => (
                          <div key={t.name} style={{ padding: "0.85rem", background: "var(--surface-3)", borderRadius: "0.5rem", border: "1px solid var(--border-color)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <div>
                                <span style={{ fontWeight: 700, color: "#eab308", fontSize: "0.88rem" }}>{t.name}</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "0.5rem" }}>{t.desc}</span>
                              </div>
                              <span style={{ fontWeight: 800, color: "#eab308", fontSize: "0.95rem" }}>${t.price}/yr</span>
                            </div>
                            <ul style={{ display: "grid", gap: "0.3rem" }}>
                              {t.benefits.map(b => (
                                <li key={b} style={{ display: "flex", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  <span style={{ color: "#eab308", flexShrink: 0 }}>✓</span> {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link href="/join">
                      <button className="btn-green" style={{ width: "100%", background: plan.code === "DOF" ? "var(--purple)" : plan.code === "BP" ? "#eab308" : undefined, color: plan.code === "BP" ? "#000" : undefined }} data-testid={`button-join-${plan.code}`}>
                        Claim {plan.code} Position
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
