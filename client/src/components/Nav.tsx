import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function Nav() {
  const [loc] = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isFounder = loc === "/pricing";
  const GREEN = "var(--green)";
  const PURPLE = "var(--purple)";

  const navBtn = (href: string, label: string, activeColor: string) => (
    <Link href={href}>
      <button
        style={{
          padding: "0.4rem 0.85rem",
          borderRadius: "0.4rem",
          border: `1px solid ${loc === href ? activeColor : "transparent"}`,
          background: loc === href ? `${activeColor}18` : "transparent",
          color: loc === href ? activeColor : "var(--text-muted)",
          fontSize: "0.83rem",
          fontWeight: loc === href ? 700 : 500,
          cursor: "pointer",
          transition: "all 0.15s",
          fontFamily: "'Satoshi', sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    </Link>
  );

  const FOUNDERS = [
    { code: "FOC", label: "Founder Ops Customer", color: GREEN, anchor: "#foc" },
    { code: "DOF", label: "Driver Ops Founder", color: PURPLE, anchor: "#dof" },
    { code: "BP",  label: "Business Partnership", color: "#eab308", anchor: "#bp" },
  ];

  return (
    <nav>
      <Link href="/">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", textDecoration: "none", color: "inherit" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="DLIVAH-AYH">
            <rect width="28" height="28" rx="6" fill="url(#nlg)" />
            <path d="M7 8h6c3.314 0 6 2.686 6 6s-2.686 6-6 6H7V8z" fill="white" opacity="0.9"/>
            <path d="M17 14l4-6v12l-4-6z" fill="url(#nlg2)" />
            <defs>
              <linearGradient id="nlg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22c55e"/><stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
              <linearGradient id="nlg2" x1="17" y1="8" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22c55e"/><stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
            DLIVAH<span style={{ color: "var(--green)" }}>-</span>AYH
          </span>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
        {navBtn("/book", "Book", GREEN)}

        {/* Become a Founder dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropOpen(d => !d)}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "0.4rem",
              border: `1px solid ${isFounder || dropOpen ? GREEN : "transparent"}`,
              background: isFounder || dropOpen ? `${GREEN}18` : "transparent",
              color: isFounder || dropOpen ? GREEN : "var(--text-muted)",
              fontSize: "0.83rem",
              fontWeight: isFounder || dropOpen ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'Satoshi', sans-serif",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            Become a Founder
            <span style={{
              fontSize: "0.6rem",
              transition: "transform 0.2s",
              transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
            }}>▼</span>
          </button>

          {dropOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              minWidth: "220px",
              background: "var(--surface-2)",
              border: "1px solid var(--border-color)",
              borderRadius: "0.75rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              overflow: "hidden",
              zIndex: 100,
            }}>
              {FOUNDERS.map((f, i) => (
                <Link
                  key={f.code}
                  href="/pricing"
                  onClick={() => {
                    setDropOpen(false);
                    // Small delay so page renders first, then scroll to section
                    setTimeout(() => {
                      const el = document.getElementById(f.code.toLowerCase());
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                  }}
                >
                  <div style={{
                    padding: "0.8rem 1.1rem",
                    cursor: "pointer",
                    borderBottom: i < FOUNDERS.length - 1 ? "1px solid var(--border-color)" : "none",
                    transition: "background 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "var(--surface-3)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      color: f.color,
                      minWidth: "36px",
                      letterSpacing: "0.03em",
                    }}>{f.code}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{f.label}</span>
                  </div>
                </Link>
              ))}

              {/* Direct link to full page */}
              <Link href="/pricing" onClick={() => setDropOpen(false)}>
                <div style={{
                  padding: "0.7rem 1.1rem",
                  background: "rgba(34,197,94,0.06)",
                  borderTop: "1px solid var(--border-color)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: GREEN,
                  transition: "background 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(34,197,94,0.12)")}
                onMouseOut={e => (e.currentTarget.style.background = "rgba(34,197,94,0.06)")}
                >
                  View All →
                </div>
              </Link>
            </div>
          )}
        </div>

        {navBtn("/driver", "Drivers", PURPLE)}
        {navBtn("/foundation", "Structure", "#eab308")}
      </div>
    </nav>
  );
}
