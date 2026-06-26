import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BACKEND = "https://backend-production-507b.up.railway.app";

type Profile = {
  name?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
};

export default function DriverProfileEditor({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile = {} } = useQuery<Profile>({
    queryKey: ["/api/driver/profile"],
  });

  const [form, setForm] = useState<Profile>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Merge saved profile into form on first load
  const merged = { ...profile, ...form };

  const saveProfile = useMutation({
    mutationFn: async (data: Profile) => {
      const res = await apiRequest("POST", "/api/driver/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
      toast({ title: "Profile saved" });
      onClose();
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`${BACKEND}/api/driver/photo`, { method: "POST", body: fd });
      const data = await res.json();
      setForm(f => ({ ...f, photoUrl: data.url }));
      toast({ title: "Photo uploaded" });
    } catch {
      toast({ title: "Photo upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const photoSrc = photoPreview || (merged.photoUrl ? `${BACKEND}${merged.photoUrl}` : null);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
    }}>
      <div style={{
        width: "100%", maxWidth: "480px",
        background: "var(--surface-2)",
        border: "1px solid var(--border-color)",
        borderRadius: "1.2rem",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "1.75rem",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.1rem" }}>Driver Profile</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.15rem" }}>
              Customers see this after booking.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* Photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.75rem", gap: "0.75rem" }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100px", height: "100px", borderRadius: "50%",
              border: `2px solid ${photoSrc ? "var(--green)" : "var(--border-color)"}`,
              background: "var(--surface-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden",
              position: "relative", transition: "border-color 0.2s",
            }}
          >
            {photoSrc ? (
              <img src={photoSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "2.5rem" }}>👤</span>
            )}
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.15s", borderRadius: "50%",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "1")}
            onMouseOut={e => (e.currentTarget.style.opacity = "0")}
            >
              <span style={{ fontSize: "1.4rem" }}>📷</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: "none", border: "1px solid var(--border-color)",
              color: "var(--text-muted)", padding: "0.35rem 0.85rem",
              borderRadius: "0.4rem", fontSize: "0.8rem", cursor: "pointer",
            }}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : photoSrc ? "Change Photo" : "Upload Photo"}
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gap: "1.1rem", marginBottom: "1.5rem" }}>
          {[
            { key: "name", label: "Full Name", placeholder: "Your name", type: "text" },
            { key: "phone", label: "Phone Number", placeholder: "(555) 000-0000", type: "tel" },
            { key: "email", label: "Email", placeholder: "you@email.com", type: "email" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={{ fontSize: "0.82rem" }}>{label}</label>
              <input
                className="input-field"
                type={type}
                placeholder={placeholder}
                value={(form[key as keyof Profile] ?? merged[key as keyof Profile]) || ""}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: "0.82rem" }}>Bio</label>
            <textarea
              className="input-field"
              placeholder="Tell customers who you are — your background, style, what makes you different."
              rows={4}
              value={(form.bio ?? merged.bio) || ""}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Save */}
        <button
          className="btn-green"
          style={{ width: "100%" }}
          onClick={() => saveProfile.mutate({ ...merged, ...form })}
          disabled={saveProfile.isPending || uploading}
        >
          {saveProfile.isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
