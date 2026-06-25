import { Link, useLocation } from "wouter";

export default function Nav() {
  const [loc] = useLocation();

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
        {navBtn("/book", "Book", "var(--green)")}
        {navBtn("/pricing", "Pricing", "var(--green)")}
        {navBtn("/driver", "Drivers", "var(--purple)")}
        {navBtn("/foundation", "Structure", "#eab308")}
      </div>
    </nav>
  );
}
