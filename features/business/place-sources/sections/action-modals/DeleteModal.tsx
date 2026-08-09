"use client";

import { useState } from "react";
import { deletePlaceSource } from "../../api";
import type { PlaceSource } from "../../types";

type Props = {
  source: PlaceSource | null;
  placeName?: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteModal({ source, placeName, onClose, onDeleted }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!source) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await deletePlaceSource(source.id);
      onDeleted();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete place source.");
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Delete place source</span>
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
            Delete the <strong>{source.sourceType}</strong> source for <strong>{placeName ?? `place #${source.placeId}`}</strong>?
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            This permanently removes the source record. This cannot be undone.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn d" onClick={handleDelete} disabled={submitting} style={{ padding: "5px 14px" }}>
            <i className="ti ti-trash" />
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
