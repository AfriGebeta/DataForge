"use client";

import { useState } from "react";
import { cancelClaim } from "../../api";
import type { BusinessClaim } from "../../types";

type Props = {
  claim: BusinessClaim | null;
  onClose: () => void;
  onCancelled: () => void;
};

export default function CancelModal({ claim, onClose, onCancelled }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleCancel = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await cancelClaim(claim.id);
      onCancelled();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to cancel claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 400 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Cancel claim</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>
            Cancel the claim for <strong>{claim.placeName ?? claim.placeId}</strong>?
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            This action can only be performed on pending claims.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Back</button>
          <button className="btn d" onClick={handleCancel} disabled={submitting} style={{ padding: "5px 14px" }}>
            <i className="ti ti-ban" />
            {submitting ? "Cancelling..." : "Cancel claim"}
          </button>
        </div>
      </div>
    </div>
  );
}
