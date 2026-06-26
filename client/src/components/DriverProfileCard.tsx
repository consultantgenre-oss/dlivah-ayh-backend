import { useQuery } from "@tanstack/react-query";

const BACKEND = "https://backend-production-507b.up.railway.app";

type Profile = {
  name?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
};

export default function DriverProfileCard() {
  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/driver/profile"],
  });

  if (!profile || (!profile.name && !profile.photoUrl)) return null;

  const photoSrc = profile.photoUrl ? `${BACKEND}${profile.photoUrl}` : null;

  return (
    <div style={{
      border: "1px solid rgba(168,85,247,0.25)",
      borderRadius: "1rem",
      background: "rgba(168,85,247,0.06)",
      padding: "1.25rem",
      marginBottom: "1.5rem",
    }}>
      <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--purple)", fontWeight: 700, marginBottom: "1rem" }}>
        Your Driver
      </p>
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          border: "2px solid var(--purple)",
          background: "var(--surface-3)",
          flexShrink: 0, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photoSrc ? (
            <img src={photoSrc} alt={profile.name || "Driver"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "1.8rem" }}>👤</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {profile.name && (
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.15rem" }}>{profile.name}</p>
          )}
          {profile.bio && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", lineHeight: 1.6, marginBottom: "0.6rem" }}>
              {profile.bio}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {profile.phone && (
              <a href={`tel:${profile.phone}`} style={{ color: "var(--green)", fontSize: "0.83rem", textDecoration: "none", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <span>📞</span> {profile.phone}
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} style={{ color: "var(--green)", fontSize: "0.83rem", textDecoration: "none", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <span>✉️</span> {profile.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
