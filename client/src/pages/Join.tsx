import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Nav from "@/components/Nav";
import { useToast } from "@/hooks/use-toast";

export default function Join() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [bpTier, setBpTier] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", businessName: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const prices: Record<string, number> = { FOC: 99.99, DOF: 99.99, Small: 99.99, Mid: 199.99, Large: 499.99 };
  const price = selected === "BP" ? (bpTier ? prices[bpTier] : null) : (selected ? prices[selected] : null);

  const canNext1 = selected !== null && (selected !== "BP" || bpTier !== null);
  const canNext2 = form.name && form.phone && (selected !== "BP" || form.businessName);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/members", {
        name: form.name, email: form.email || null, phone: form.phone,
        role: selected, businessName: form.businessName || null,
        vehicleType: null, licenseNumber: null,
        status: "active", joinedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => setConfirmed(true),
    onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
  });

  const reset = () => { setConfirmed(false); setStep(1); setSelected(null); setBpTier(null); setForm({ name: "", email: "", phone: "", businessName: "" }); };

  if (confirmed) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <Nav />
        <div style={{ maxWidth: "400px", margin: "6rem auto", padding: "0 1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</p>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>You're in.</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>We'll be in touch.</p>
          <button className="btn-green" onClick={reset}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <Nav />
      <div style={{ maxWidth: "480px", margin: "3rem auto", padding: "0 1.5rem 5rem" }}>

        <h1 style={{ fontSize: "1.6rem", letterSpacing: "-0.02em", marginBottom: "2rem" }}>Join</h1>

        {/* STEP 1 — Pick */}
        {step === 1 && (
          <div>
            <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.5rem" }}>

              {/* FOC */}
              <div className="card" data-testid="card-FOC" onClick={() => setSelected("FOC")} style={{ cursor: "pointer", border: `1px solid ${selected === "FOC" ? "var(--green)" : "var(--border-color)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--green)" }}>FOC</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>Customer · $99.99/yr</p>
                </div>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${selected === "FOC" ? "var(--green)" : "var(--border-color)"}`, background: selected === "FOC" ? "var(--green)" : "transparent" }} />
              </div>

              {/* DOF */}
              <div className="card" data-testid="card-DOF" onClick={() => setSelected("DOF")} style={{ cursor: "pointer", border: `1px solid ${selected === "DOF" ? "var(--purple)" : "var(--border-color)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--purple)" }}>DOF</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>Driver · $99.99/yr</p>
                </div>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${selected === "DOF" ? "var(--purple)" : "var(--border-color)"}`, background: selected === "DOF" ? "var(--purple)" : "transparent" }} />
              </div>

              {/* BP */}
              <div className="card" data-testid="card-BP" onClick={() => setSelected("BP")} style={{ cursor: "pointer", border: `1px solid ${selected === "BP" ? "#eab308" : "var(--border-color)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: selected === "BP" ? "1rem" : 0 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: "#eab308" }}>BP</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>Business · from $99.99/yr</p>
                  </div>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${selected === "BP" ? "#eab308" : "var(--border-color)"}`, background: selected === "BP" ? "#eab308" : "transparent" }} />
                </div>
                {selected === "BP" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
                    {[{ name: "Small", price: "$99.99" }, { name: "Mid", price: "$199.99" }, { name: "Large", price: "$499.99" }].map(t => (
                      <div key={t.name} data-testid={`tier-${t.name}`} onClick={e => { e.stopPropagation(); setBpTier(t.name); }}
                        style={{ padding: "0.65rem", borderRadius: "0.4rem", border: `1px solid ${bpTier === t.name ? "#eab308" : "var(--border-color)"}`, background: bpTier === t.name ? "rgba(234,179,8,0.1)" : "var(--surface-3)", cursor: "pointer", textAlign: "center" }}>
                        <p style={{ fontWeight: 700, fontSize: "0.82rem", color: bpTier === t.name ? "#eab308" : "var(--text)" }}>{t.name}</p>
                        <p style={{ fontSize: "0.82rem", color: "#eab308", fontWeight: 700 }}>{t.price}/yr</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className="btn-green" style={{ width: "100%", opacity: canNext1 ? 1 : 0.4 }} disabled={!canNext1} onClick={() => setStep(2)} data-testid="button-next1">
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 — Info */}
        {step === 2 && (
          <div>
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label>Name</label>
                <input className="input-field" placeholder="Full name" value={form.name} onChange={e => set("name", e.target.value)} data-testid="input-name" />
              </div>
              <div>
                <label>Phone</label>
                <input className="input-field" placeholder="(555) 000-0000" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} data-testid="input-phone" />
              </div>
              <div>
                <label>Email <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", fontSize: "0.75rem" }}>(optional)</span></label>
                <input className="input-field" placeholder="you@email.com" type="email" value={form.email} onChange={e => set("email", e.target.value)} data-testid="input-email" />
              </div>
              {selected === "BP" && (
                <div>
                  <label>Business Name</label>
                  <input className="input-field" placeholder="Company name" value={form.businessName} onChange={e => set("businessName", e.target.value)} data-testid="input-business" />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn-green" style={{ flex: 2, opacity: canNext2 ? 1 : 0.4 }} disabled={!canNext2} onClick={() => setStep(3)} data-testid="button-next2">Review</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && (
          <div>
            <div className="card" style={{ marginBottom: "1.25rem" }}>
              {[
                ["Position", selected],
                selected === "BP" ? ["Tier", bpTier] : null,
                ["Name", form.name],
                ["Phone", form.phone],
                form.email ? ["Email", form.email] : null,
                selected === "BP" ? ["Business", form.businessName] : null,
                ["Membership", `$${price?.toFixed(2)}/yr`],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.6rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn-green" style={{ flex: 2, opacity: mutation.isPending ? 0.5 : 1 }} disabled={mutation.isPending} onClick={() => mutation.mutate()} data-testid="button-confirm">
                {mutation.isPending ? "..." : `Confirm · $${price?.toFixed(2)}/yr`}
              </button>
            </div>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.72rem" }}>Payment processing coming soon</p>
          </div>
        )}

      </div>
    </div>
  );
}
