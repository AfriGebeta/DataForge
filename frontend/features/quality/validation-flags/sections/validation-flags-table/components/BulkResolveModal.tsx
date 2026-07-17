"use client";

import { useState } from "react";
import { bulkResolveFlags } from "../../../api";
import type { BulkResolveRequest, FlagCategory } from "../../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
};

const defaultForm: BulkResolveRequest = {
  place_id: "",
  category: undefined,
  resolved_by: "",
};

export default function BulkResolveModal({ isOpen, onClose, onResolved }: Props) {
  const [form, setForm] = useState<BulkResolveRequest>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handleSubmit = async () => {
    if (!form.place_id || !form.resolved_by) {
      setError("Place ID and Resolved by are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await bulkResolveFlags(form);
      onResolved();
      onClose();
      setForm(defaultForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to bulk resolve.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 400 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Bulk resolve flags</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18 }}>
          {error && <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div className="fg">
            <label className="fl">Place ID <span>*</span></label>
            <input type="text" name="place_id" placeholder="xxxxxxxx-xxxx-…" value={form.place_id} onChange={handleChange} />
            <div className="fh">Resolves all open flags on this place</div>
          </div>

          <div className="fg">
            <label className="fl">Category (optional)</label>
            <select name="category" value={form.category ?? ""} onChange={handleChange}>
              <option value="">All categories</option>
              <option value="GEOMETRY">GEOMETRY</option>
              <option value="ADDRESS">ADDRESS</option>
              <option value="NAME">NAME</option>
              <option value="CONTACT">CONTACT</option>
              <option value="FRESHNESS">FRESHNESS</option>
            </select>
          </div>

          <div className="fg">
            <label className="fl">Resolved by <span>*</span></label>
            <input type="text" name="resolved_by" placeholder="ops-team" value={form.resolved_by} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            <i className="ti ti-check" />
            {submitting ? "Resolving..." : "Resolve all"}
          </button>
        </div>
      </div>
    </div>
  );
}