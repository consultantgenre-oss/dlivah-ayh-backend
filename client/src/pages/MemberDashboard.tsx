import { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import type { Member } from "@shared/schema";

const BACKEND = "https://backend-production-507b.up.railway.app";

const ROLE_META: Record<string, { color: string; glow: string; border: string; icon: string }> = {
  FOC: { color: "#22c55e", glow: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.3)", icon: "🚗" },
  DOF: { color: "#a855f7", glow: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.3)", icon: "🛻" },
  BP:  { color: "#eab308", glow: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.3)",  icon: "🏢" },
};

const BENEFITS: Record<string, string[]> = {
  FOC: [
    "12 ride credits per year — credited to your account",
    "Priority booking — always first in line",
    "Non-conventional pricing — no surge, no algorithm",
    "Founding rate locked at time of membership",
    "Referral & affiliate earnings",
  ],
  DOF: [
    "90% revenue per job — you keep what you earn",
    "Non-conventional driver rate — not platform-controlled",
    "Founding driver position in the AYH network",
    "Priority job access",
    "Founding rate locked at annual renewal",
  ],
  BP: [
    "Early access to new platform features",
    "Preferred API & advertising pricing",
    "Business account & direct scheduling",
    "Referral revenue share",
    "Direct operator line",
  ],
};

function useParam(name: string): string {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const match = hash.match(new RegExp(`/${name}/([^/?#]+)`));
  return match ? match[1] : "";
}

interface ReferralData {
  count: number;
  referrals: { id: number; name: string; role: string; paymentStatus: string; joinedAt: string }[];
}

export default function MemberDashboard() {
  const rawId = useParam("member");
  const memberId = parseInt(rawId);
  const [lookupId, setLookupId] = useState("");
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const { data: member, isLoading, error } = useQuery<Member>({
    queryKey: [`/api/members/${memberId}`],
    enabled: !isNaN(memberId) && memberId > 0,
    queryFn: () => fetch(`${BACKEND}/api/members/${memberId}`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
  });

  const [lookupResult, setLookupResult] = useState<Member | null>(null);
  const [lookupErr, setLookupErr] = useState("");
  const handleLookup = async () => {
    const id = parseInt(lookupId);
    if (isNaN(id)) { setLookupErr("Enter a valid Member ID"); return; }
    setLookupErr("");
    const res = await fetch(`${BACKEND}/api/members/${id}`);
    if (!res.ok) { setLookupErr("Member ID not found"); return; }
    const data = await res.json();
    setLookupResult(data);
    setSearched(true);
    window.location.hash = `/member/${id}`;
  };

  const display: Member | null = member ?? lookupResult;
  const meta = display ? ROLE_META[display.role] ?? ROLE_META.FOC : null;
  const isPaid = display?.paymentStatus === "paid";
  const isActive = display?.status === "active";

  const displayId = display?.id;
  const { data: referralData } = useQuery<ReferralData>({
    queryKey: ["/api/members", displayId, "referrals"],
    enabled: !!displayId && isPaid,
    queryFn: () => fetch(`${BACKEND}/api/members/${displayId}/referrals`).then(r => r.json()),
  });

  const referralLink = display ? `https://dlivah.live/#/join?ref=${display.id}` : "";

  useEffect(() => {
    if (qrCanvasRef.current && referralLink) {
      QRCode.toCanvas(qrCanvasRef.current, referralLink, {
        width: 180,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [referralLink]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // No ID in URL — show lookup form
  if (isNaN(memberId) && !searched) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <Nav />
        <div style={{ maxWidth: "440px", margin: "5rem auto", padding: "0 1.5rem" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
            Member Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "2rem" }}>
            Enter your Member ID to access your dashboard.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input-field"
              style={{ flex: 1 }}
              placeholder="Your Member ID (e.g. 1)"
              value={lookupId}
              onChange={e => setLookupId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLookup()}
            />
            <button className="btn-green" style={{ whiteSpace: "nowrap" }} onClick={handleLookup}>
              Access →
            </button>
          </div>
          {lookupErr && <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "0.5rem" }}>{lookupErr}</p>}
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "1rem" }}>
            You received your Member ID after registering as a founder.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <Nav />
        <div style={{ textAlign: "center", paddingTop: "8rem", color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!display) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <Nav />
        <div style={{ maxWidth: "440px", margin: "5rem auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</p>
          <p style={{ fontWeight: 700 }}>Member not found</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "0.5rem" }}>
            Check your Member ID and try again.
          </p>
          <button className="btn-green" style={{ marginTop: "1.5rem" }} onClick={() => { setSearched(false); setLookupResult(null); window.location.hash = "/member"; }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "620px", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>

        {/* Header card */}
        <div style={{
          borderRadius: "1.1rem",
          border: `1px solid ${meta!.border}`,
          background: meta!.glow,
          padding: "1.5rem 1.6rem",
          marginBottom: "1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1.5rem" }}>{meta!.icon}</span>
              <span style={{ fontWeight: 900, fontSize: "1.4rem", color: meta!.color, letterSpacing: "-0.02em" }}>
                {display.role}
              </span>
              {display.tier && (
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                  borderRadius: "999px", background: `${meta!.color}20`, color: meta!.color,
                }}>
                  {display.tier}
                </span>
              )}
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>{display.name}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{display.email}</p>
            {display.businessName && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{display.businessName}</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.3rem 0.75rem", borderRadius: "999px",
              background: isActive ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
              border: `1px solid ${isActive ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.4)"}`,
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isActive ? "#22c55e" : "#f59e0b", display: "block" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: isActive ? "#22c55e" : "#f59e0b" }}>
                {isActive ? "Active" : "Payment Pending"}
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Member #{display.id}
            </p>
          </div>
        </div>

        {/* Payment pending notice */}
        {!isPaid && (
          <div style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "0.85rem", padding: "1.1rem 1.3rem", marginBottom: "1.5rem",
          }}>
            <p style={{ fontWeight: 700, color: "#f59e0b", marginBottom: "0.35rem" }}>⏳ Payment Verification Pending</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              Your registration is complete. Once your ${display.membershipPrice} payment is confirmed,
              your account will be fully activated and all benefits will unlock.
            </p>
          </div>
        )}

        {/* Benefits grid */}
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Your Benefits
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.6rem" }}>
            {(BENEFITS[display.role] ?? []).map(b => (
              <li key={b} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.88rem" }}>
                <span style={{ color: meta!.color, flexShrink: 0, marginTop: "0.1rem", opacity: isPaid ? 1 : 0.4 }}>✓</span>
                <span style={{ opacity: isPaid ? 1 : 0.4 }}>{b}</span>
              </li>
            ))}
          </ul>
          {!isPaid && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "1rem", fontStyle: "italic" }}>
              Benefits unlock when payment is confirmed.
            </p>
          )}
        </div>

        {/* FOC ride credits */}
        {display.role === "FOC" && isPaid && (
          <div className="card" style={{ marginBottom: "1.25rem", border: `1px solid ${meta!.border}` }}>
            <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Ride Credits
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <p style={{ fontSize: "3rem", fontWeight: 900, color: meta!.color, lineHeight: 1 }}>12</p>
              <div>
                <p style={{ fontWeight: 700 }}>Domestic Ride Credits</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Renew annually with your membership</p>
              </div>
            </div>
          </div>
        )}

        {/* Referral Section */}
        {isPaid && (
          <div className="card" style={{ marginBottom: "1.25rem", border: `1px solid ${meta!.border}` }}>
            <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Your Referral Link
            </p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: "120px",
                background: `${meta!.color}12`, border: `1px solid ${meta!.border}`,
                borderRadius: "0.75rem", padding: "0.85rem 1rem",
              }}>
                <p style={{ fontSize: "1.8rem", fontWeight: 900, color: meta!.color, lineHeight: 1 }}>
                  {referralData?.count ?? 0}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Confirmed referrals</p>
              </div>
              <div style={{
                flex: 1, minWidth: "120px",
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                borderRadius: "0.75rem", padding: "0.85rem 1rem",
              }}>
                <p style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1 }}>
                  {display.role === "BP" && display.tier === "Mid"
                    ? `$${(referralData?.count ?? 0) * 20}`
                    : display.role === "BP" && display.tier === "Large"
                    ? `$${(referralData?.count ?? 0) * 50}`
                    : display.role === "DOF"
                    ? `${referralData?.count ?? 0} mo`
                    : `$${(referralData?.count ?? 0) * 10}`}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {display.role === "DOF" ? "Extension earned" : "Credit earned"}
                </p>
              </div>
            </div>

            {/* QR code */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{
                background: "#ffffff", borderRadius: "0.6rem",
                padding: "0.5rem", display: "inline-block", flexShrink: 0,
              }}>
                <canvas ref={qrCanvasRef} style={{ display: "block" }} />
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.5rem" }}>Share your link</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.85rem", lineHeight: 1.5 }}>
                  When someone joins using your referral link, you earn credit automatically.
                </p>
                <div style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                  borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
                  fontSize: "0.75rem", fontFamily: "monospace",
                  color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "0.6rem",
                }}>
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? "rgba(34,197,94,0.15)" : `${meta!.color}20`,
                    border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : meta!.border}`,
                    color: copied ? "#22c55e" : meta!.color,
                    borderRadius: "0.5rem", padding: "0.45rem 1rem",
                    fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Recent referrals list */}
            {referralData && referralData.referrals.length > 0 && (
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                  Recent Referrals
                </p>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  {referralData.referrals.slice(0, 5).map(r => (
                    <div key={r.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: "0.82rem", padding: "0.35rem 0",
                    }}>
                      <span>{r.name} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>· {r.role}</span></span>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700, padding: "0.1rem 0.5rem",
                        borderRadius: "999px",
                        background: r.paymentStatus === "paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                        color: r.paymentStatus === "paid" ? "#22c55e" : "#f59e0b",
                      }}>
                        {r.paymentStatus === "paid" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Membership info */}
        <div className="card">
          <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Membership
          </p>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {[
              ["Position", display.role + (display.tier ? ` · ${display.tier}` : "")],
              ["Annual Fee", `$${display.membershipPrice}`],
              ["Payment", isPaid ? "✓ Confirmed" : "⏳ Pending"],
              ["Joined", new Date(display.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span style={{ fontWeight: 600, color: k === "Payment" && isPaid ? "#22c55e" : "inherit" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2rem" }}>
          Questions? Contact your network operator directly.
        </p>

      </div>
    </div>
  );
}
