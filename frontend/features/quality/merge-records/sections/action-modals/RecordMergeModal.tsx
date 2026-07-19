"use client";

import { useState } from "react";
import { createMergeRecord } from "../../api";
import type { CreateMergeRecordRequest, MergeStrategy } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const defaultForm: CreateMergeRecordRequest = {
  winner_id: "",
  loser_id: "",
  strategy: "MANUAL",
  reason: "",
  merged_by: "",
};

export default function RecordMergeModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateMergeRecordRequest>(defaultForm);
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
    if (!form.winner_id || !form.loser_id || !form.reason) {
      setError("Winner ID, Loser ID and Merge reason are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createMergeRecord(form);
      onCreated();
      onClose();
      setForm(defaultForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to record merge.");
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
          width: 440,
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Record merge</span>
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
              <label className="fl">Winner place ID <span>*</span></label>
              <input
                type="text"
                name="winner_id"
                placeholder="UUID kept"
                value={form.winner_id}
                onChange={handleChange}
              />
            </div>
            <div className="fg">
              <label className="fl">Loser place ID <span>*</span></label>
              <input
                type="text"
                name="loser_id"
                placeholder="UUID removed"
                value={form.loser_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="fg">
            <label className="fl">Strategy <span>*</span></label>
            <select name="strategy" value={form.strategy} onChange={handleChange}>
              <option value="MANUAL">MANUAL</option>
              <option value="AUTO_DISTANCE">AUTO_DISTANCE</option>
              <option value="AUTO_NAME_MATCH">AUTO_NAME_MATCH</option>
              <option value="AUTO_OVERLAP">AUTO_OVERLAP</option>
            </select>
          </div>

          <div className="fg">
            <label className="fl">Merge reason <span>*</span></label>
            <textarea
              name="reason"
              placeholder="Distance 4.2m, name similarity 0.97, same address block"
              value={form.reason}
              onChange={handleChange}
            />
          </div>

          <div className="fg">
            <label className="fl">Merged by</label>
            <input
              type="text"
              name="merged_by"
              placeholder="conflation-worker-v2"
              value={form.merged_by}
              onChange={handleChange}
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
            {submitting ? "Recording..." : "Record merge"}
          </button>
        </div>
      </div>
    </div>
  );
}