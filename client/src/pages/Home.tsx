import { Link } from "wouter";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "6rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem" }}>
          DLIVAH-AYH
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "3rem" }}>
          Greater Hartford, CT · Rides · Moves · Deliveries
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "320px", margin: "0 auto" }}>
          <Link href="/book">
            <button className="btn-green" style={{ width: "100%", fontSize: "1rem", padding: "0.9rem" }} data-testid="button-book">
              Book Now
            </button>
          </Link>
          <Link href="/pricing">
            <button className="btn-purple" style={{ width: "100%", fontSize: "1rem", padding: "0.9rem" }} data-testid="button-join">
              Join
            </button>
          </Link>
          <Link href="/driver">
            <button className="btn-outline" style={{ width: "100%", fontSize: "1rem", padding: "0.9rem" }} data-testid="button-driver">
              Driver Portal
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
