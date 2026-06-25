import Nav from "@/components/Nav";

export default function Foundation() {
  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "480px", margin: "4rem auto", padding: "0 1.5rem 5rem" }}>
        <h1 style={{ fontSize: "1.6rem", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>DLIVAH-AYH</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
          Delivery is the service. Traffic is the business.
        </p>
      </div>
    </div>
  );
}
