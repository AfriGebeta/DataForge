"use client";

import { useState } from "react";
import { createValidationFlag } from "../../../api";
import type { CreateFlagRequest, FlagCategory, FlagSeverity } from "../../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const defaultForm: CreateFlagRequest = {
  place_id: "",
  category: "GEOMETRY",
  severity: "ERROR",
  flag_code: "",
  message: "",
};

export default function CreateFlagModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateFlagRequest>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.place_id || !form.flag_code || !form.message) {
      setError("Place ID, Flag code and Message are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createValidationFlag(form);
      onCreated();
      onClose();
      setForm(defaultForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create flag.");
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
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 440 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Create validation flag</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18 }}>
          {error && <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div className="fg">
            <label className="fl">Place ID <span>*</span></label>
            <input type="text" name="place_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={form.place_id} onChange={handleChange} />
          </div>

          <div className="fr">
            <div className="fg">
              <label className="fl">Category <span>*</span></label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="GEOMETRY">GEOMETRY</option>
                <option value="ADDRESS">ADDRESS</option>
                <option value="NAME">NAME</option>
                <option value="HIERARCHY">HIERARCHY</option>
                <option value="CONTACT">CONTACT</option>
                <option value="FRESHNESS">FRESHNESS</option>
                <option value="CONSISTENCY">CONSISTENCY</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Severity <span>*</span></label>
              <select name="severity" value={form.severity} onChange={handleChange}>
                <option value="CRITICAL">CRITICAL</option>
                <option value="ERROR">ERROR</option>
                <option value="WARNING">WARNING</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
          </div>

          <div className="fg">
            <label className="fl">Flag code <span>*</span></label>
            <input type="text" name="flag_code" placeholder="COORD_OUT_OF_COUNTRY" value={form.flag_code} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Message <span>*</span></label>
            <textarea name="message" placeholder="Coordinates fall outside the expected country boundary" value={form.message} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            <i className="ti ti-check" />
            {submitting ? "Creating..." : "Create flag"}
          </button>
        </div>
      </div>
    </div>
  );
}