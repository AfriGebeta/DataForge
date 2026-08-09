"use client";

import { useState } from "react";
import { createPlaceSource } from "../../api";
import { SOURCE_TYPES, type SourceType } from "../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const EMPTY = {
  placeId: "",
  sourceType: "OSM" as SourceType,
  sourceName: "",
  sourceId: "",
  sourceUrl: "",
  confidenceScore: "0.5",
  isPrimary: false,
};

export default function CreateModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.placeId.trim()) {
      setError("Place ID is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createPlaceSource({
        placeId: form.placeId.trim(),
        sourceType: form.sourceType,
        sourceName: form.sourceName || undefined,
        sourceId: form.sourceId || undefined,
        sourceUrl: form.sourceUrl || undefined,
        confidenceScore: form.confidenceScore ? Number(form.confidenceScore) : undefined,
        isPrimary: form.isPrimary,
      });
      onCreated();
      onClose();
      setForm(EMPTY);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create place source.");
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Add place source</span>
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
            <label className="fl">Place ID</label>
            <input type="text" inputMode="numeric" name="placeId" placeholder="e.g. 101" value={form.placeId} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Source type</label>
            <select name="sourceType" value={form.sourceType} onChange={handleChange}>
              {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="fg">
            <label className="fl">Source name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input type="text" name="sourceName" placeholder="e.g. OpenStreetMap" value={form.sourceName} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Source ID <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input type="text" name="sourceId" placeholder="e.g. node/12345" value={form.sourceId} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Source URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input type="text" name="sourceUrl" placeholder="https://..." value={form.sourceUrl} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Confidence score (0–1)</label>
            <input type="number" name="confidenceScore" min={0} max={1} step={0.05} value={form.confidenceScore} onChange={handleChange} />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <input type="checkbox" name="isPrimary" checked={form.isPrimary} onChange={handleChange} />
            Mark as primary source
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add source"}
          </button>
        </div>
      </div>
    </div>
  );
}
