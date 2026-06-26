import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const SESSION_KEY = "dlivah_driver_auth";

type Props = { onAuth: () => void };

export default function DriverLogin({ onAuth }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [settingUp, setSettingUp] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupError, setSetupError] = useState("");

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  // Check session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "authenticated") onAuth();
  }, []);

  const hasPin = !!settings.driver_pin;

  const handleLogin = () => {
    if (!input.trim()) return;
    if (input === settings.driver_pin) {
      sessionStorage.setItem(SESSION_KEY, "authenticated");
      onAuth();
    } else {
      setError("Incorrect PIN. Try again.");
      setInput("");
    }
  };

  const handleSetup = async () => {
    setSetupError("");
    if (newPin.length < 4) { setSetupError("PIN must be at least 4 characters."); return; }
    if (newPin !== confirmPin) { setSetupError("PINs don't match."); return; }
    await fetch("https://backend-production-507b.up.railway.app/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "driver_pin", value: newPin }),
    });
    sessionStorage.setItem(SESSION_KEY, "authenticated");
    onAuth();
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
      background: "var(--bg)",
    }}>
      <div style={{
        width: "100%", maxWidth: "360px",
        background: "var(--surface-2)",
        border: "1px solid var(--border-color)",
        borderRadius: "1.25rem",
        padding: "2rem 2rem 2.25rem",
        boxShadow: "0 0 40px rgba(168,85,247,0.08)",
      }}>
        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #a855f7)",
            margin: "0 auto 1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem",
          }}>🚗</div>
          <p style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>Driver Access</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
            {hasPin ? "Enter your PIN to continue." : "Set a PIN to secure your portal."}
          </p>
        </div>

        {!hasPin || settingUp ? (
          /* Setup mode */
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Create PIN</label>
              <input
                className="input-field"
                type="password"
                placeholder="Choose a PIN or password"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSetup()}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem" }}>Confirm PIN</label>
              <input
                className="input-field"
                type="password"
                placeholder="Confirm your PIN"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSetup()}
              />
            </div>
            {setupError && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{setupError}</p>}
            <button className="btn-green" style={{ width: "100%", marginTop: "0.25rem" }} onClick={handleSetup}>
              Set PIN & Enter Portal
            </button>
          </div>
        ) : (
          /* Login mode */
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem" }}>PIN</label>
              <input
                className="input-field"
                type="password"
                placeholder="Enter your PIN"
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoFocus
              />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}
            <button
              className="btn-purple"
              style={{ width: "100%", marginTop: "0.25rem" }}
              onClick={handleLogin}
              disabled={!input.trim()}
            >
              Enter Portal
            </button>
            <button
              onClick={() => setSettingUp(true)}
              style={{
                background: "none", border: "none", color: "var(--text-muted)",
                fontSize: "0.78rem", cursor: "pointer", textAlign: "center",
              }}
            >
              Change PIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
