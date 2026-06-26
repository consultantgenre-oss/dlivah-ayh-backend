import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Nav from "@/components/Nav";
import type { Booking } from "@shared/schema";

type Msg = { id: number; bookingId: number; sender: string; text: string; sentAt: string };

export default function CustomerThread() {
  const params = useParams<{ id: string }>();
  const bookingId = parseInt(params.id || "0");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: booking } = useQuery<Booking>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  const { data: messages = [] } = useQuery<Msg[]>({
    queryKey: [`/api/bookings/${bookingId}/messages`],
    enabled: !!bookingId,
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/messages`, { sender: "customer", text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/messages`] });
      setInput("");
    },
  });

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    sendMsg.mutate(t);
  };

  const STATUS_COLOR: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "var(--green)",
    in_progress: "var(--purple)",
    completed: "#94a3b8",
    cancelled: "#ef4444",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", padding: "1.5rem 1rem 0" }}>

        {/* Booking info */}
        {booking && (
          <div className="card" style={{ marginBottom: "1rem", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem" }}>
                  {booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)} · {booking.scheduledDate}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {booking.pickupAddress} → {booking.dropoffAddress}
                </p>
              </div>
              <span style={{
                padding: "0.25rem 0.65rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                background: `${STATUS_COLOR[booking.status] || "#94a3b8"}18`,
                color: STATUS_COLOR[booking.status] || "#94a3b8",
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {booking.status.replace("_", " ")}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", paddingBottom: "1rem" }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", marginTop: "3rem" }}>
              No messages yet. Your driver will reach out here.
            </p>
          )}
          {messages.map(m => {
            const isCustomer = m.sender === "customer";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isCustomer ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "78%", padding: "0.65rem 1rem",
                  borderRadius: isCustomer ? "1rem 1rem 0.2rem 1rem" : "1rem 1rem 1rem 0.2rem",
                  background: isCustomer ? "var(--green)" : "var(--surface-3)",
                  color: isCustomer ? "#000" : "var(--text)",
                  fontSize: "0.88rem", lineHeight: 1.5,
                }}>
                  {!isCustomer && (
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--purple)", marginBottom: "0.25rem" }}>Driver</p>
                  )}
                  <p style={{ margin: 0 }}>{m.text}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", opacity: 0.6, textAlign: "right" }}>
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "0.75rem 0 1.25rem", display: "flex", gap: "0.5rem", flexShrink: 0, borderTop: "1px solid var(--border-color)" }}>
          <input
            style={{
              flex: 1, background: "var(--surface-3)",
              border: "1px solid var(--border-color)", borderRadius: "0.6rem",
              padding: "0.65rem 0.9rem", color: "var(--text)", fontSize: "0.9rem",
              outline: "none", fontFamily: "'Satoshi', sans-serif",
            }}
            placeholder="Message your driver..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMsg.isPending}
            style={{
              padding: "0.65rem 1.1rem", borderRadius: "0.6rem",
              background: "var(--green)", color: "#000",
              border: "none", fontWeight: 700, fontSize: "0.88rem",
              cursor: input.trim() ? "pointer" : "not-allowed",
              opacity: input.trim() ? 1 : 0.4,
              fontFamily: "'Satoshi', sans-serif",
            }}
          >Send</button>
        </div>
      </div>
    </div>
  );
}
