"use client";

import { useState } from "react";
import { rejectClaim } from "../../api";
import type { BusinessClaim } from "../../types";

type Props = {
  claim: BusinessClaim | null;
  placeName?: string;
  onClose: () => void;
  onRejected: () => void;
};

export default function RejectModal({ claim, placeName, onClose, onRejected }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleReject = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await rejectClaim(claim.id, reason || undefined);
      onRejected();
      onClose();
      setReason("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to reject claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Reject claim</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>
            Reject the claim for <strong>{placeName ?? `place #${claim.placeId}`}</strong>?
          </p>
          <div className="fg">
            <label className="fl">Reason <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <textarea
              rows={3}
              placeholder="Explain why this claim is being rejected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn d" onClick={handleReject} disabled={submitting} style={{ padding: "5px 14px" }}>
            <i className="ti ti-x" />
            {submitting ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
