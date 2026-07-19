"use client";

import { useState } from "react";
import { createPlaceDelta } from "../../api";
import type { CreatePlaceDeltaRequest, DeltaAction } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const defaultForm: CreatePlaceDeltaRequest = {
  source_place_id: "",
  target_place_id: "",
  action: "UPDATE",
  field_name: "",
  before_data: "",
  after_data: "",
};

export default function RecordDeltaModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreatePlaceDeltaRequest>(defaultForm);
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
    if (!form.source_place_id || !form.after_data) {
      setError("Source place ID and After data are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createPlaceDelta(form);
      onCreated();
      onClose();
      setForm(defaultForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to record delta.");
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
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: 12,
          width: 460,
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>Record place delta</span>
          <button className="btn sm ghost" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 10 }}>
              {error}
            </div>
          )}

          <div className="fr">
            <div className="fg">
              <label className="fl">Source place ID <span>*</span></label>
              <input type="text" name="source_place_id" placeholder="UUID" value={form.source_place_id} onChange={handleChange} />
            </div>
            <div className="fg">
              <label className="fl">Target place ID</label>
              <input type="text" name="target_place_id" placeholder="UUID (optional)" value={form.target_place_id ?? ""} onChange={handleChange} />
            </div>
          </div>

          <div className="fr">
            <div className="fg">
              <label className="fl">Action <span>*</span></label>
              <select name="action" value={form.action} onChange={handleChange}>
                <option value="UPDATE">UPDATE</option>
                <option value="ADD">ADD</option>
                <option value="REMOVE">REMOVE</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Field name</label>
              <input type="text" name="field_name" placeholder="phone" value={form.field_name ?? ""} onChange={handleChange} />
            </div>
          </div>

          <div className="fg">
            <label className="fl">Before data (JSON)</label>
            <textarea
              name="before_data"
              placeholder='{"phone":"+251911000001"}'
              value={form.before_data ?? ""}
              onChange={handleChange}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, minHeight: 50 }}
            />
          </div>

          <div className="fg">
            <label className="fl">After data (JSON) <span>*</span></label>
            <textarea
              name="after_data"
              placeholder='{"phone":"+251911000002"}'
              value={form.after_data}
              onChange={handleChange}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, minHeight: 50 }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            <i className="ti ti-check" />
            {submitting ? "Recording..." : "Record delta"}
          </button>
        </div>
      </div>
    </div>
  );
}