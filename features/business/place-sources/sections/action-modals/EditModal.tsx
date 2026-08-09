"use client";

import { useEffect, useState } from "react";
import { updatePlaceSource } from "../../api";
import type { PlaceSource } from "../../types";

type Props = {
  source: PlaceSource | null;
  onClose: () => void;
  onEdited: () => void;
};

export default function EditModal({ source, onClose, onEdited }: Props) {
  const [sourceName, setSourceName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [confidenceScore, setConfidenceScore] = useState("0.5");
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    setSourceName(source.sourceName ?? "");
    setSourceId(source.sourceId ?? "");
    setSourceUrl(source.sourceUrl ?? "");
    setConfidenceScore(String(source.confidenceScore));
    setIsPrimary(source.isPrimary);
    setError(null);
  }, [source]);

  if (!source) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await updatePlaceSource(source.id, {
        sourceName: sourceName || undefined,
        sourceId: sourceId || undefined,
        sourceUrl: sourceUrl || undefined,
        confidenceScore: confidenceScore ? Number(confidenceScore) : undefined,
        isPrimary,
      });
      onEdited();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update place source.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 440, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Edit place source</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div className="fg">
            <label className="fl">Source type</label>
            <input type="text" value={source.sourceType} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="fg">
            <label className="fl">Source name</label>
            <input type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Source ID</label>
            <input type="text" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Source URL</label>
            <input type="text" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Confidence score (0–1)</label>
            <input type="number" min={0} max={1} step={0.05} value={confidenceScore} onChange={(e) => setConfidenceScore(e.target.value)} />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
            Mark as primary source
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
