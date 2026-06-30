import Nav from "@/components/Nav";

export default function Foundation() {
  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />

      {/* Hero tagline block */}
      <div style={{
        borderBottom: "1px solid var(--border-color)",
        padding: "5rem 1.5rem 4rem",
        textAlign: "center",
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)",
      }}>
        <p style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--green)",
          marginBottom: "1.25rem",
        }}>
          Structure
        </p>

        <h1 style={{
          fontFamily: "'Cabinet Grotesk', sans-serif",
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          marginBottom: "1.25rem",
          background: "linear-gradient(135deg, #22c55e 0%, #a855f7 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          DLIVAH-AYH
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
          fontWeight: 500,
          color: "var(--text-muted)",
          letterSpacing: "-0.01em",
          lineHeight: 1.5,
          maxWidth: "500px",
          margin: "0 auto",
        }}>
          Delivery is the service.{" "}
          <span style={{ color: "var(--purple)", fontWeight: 700 }}>Traffic is the business.</span>
        </p>
      </div>

      {/* Movement statement */}
      <div style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "4rem 1.5rem 6rem",
      }}>
        {/* Accent bar */}
        <div style={{
          width: "40px",
          height: "3px",
          background: "linear-gradient(90deg, #22c55e, #a855f7)",
          borderRadius: "999px",
          marginBottom: "2rem",
        }} />

        <p style={{
          fontSize: "clamp(1.05rem, 2vw, 1.2rem)",
          lineHeight: 1.9,
          color: "var(--text-muted)",
          fontWeight: 400,
        }}>
          Drivers, customers, and businesses — operating under one structure.
          Built in Greater Hartford. Expanding from here.
        </p>
      </div>
    </div>
  );
}
