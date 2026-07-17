"use client";

import { useState } from "react";
import { createCompletenessRule } from "../../../api";
import type {
  CompletenessLevel,
  CreateCompletenessRuleRequest,
  PlaceType,
} from "../../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const defaultForm: CreateCompletenessRuleRequest = {
  place_type: "POI",
  level: "MINIMAL",
  required_field: "",
  weight: 0.15,
  description: "",
};

export default function CreateRuleModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateCompletenessRuleRequest>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "weight" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.required_field) {
      setError("Required field is mandatory.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCompletenessRule(form);
      onCreated();
      onClose();
      setForm(defaultForm);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to create rule.",
      );
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
          width: 420,
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            Create completeness rule
          </span>
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
              <label className="fl">Place type <span>*</span></label>
              <select name="place_type" value={form.place_type} onChange={handleChange}>
                <option value="POI">POI</option>
                <option value="ROAD">ROAD</option>
                <option value="BUILDING">BUILDING</option>
                <option value="MUNICIPALITY">MUNICIPALITY</option>
                <option value="TRANSIT_STOP">TRANSIT_STOP</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Applies to level <span>*</span></label>
              <select name="level" value={form.level} onChange={handleChange}>
                <option value="MINIMAL">MINIMAL</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="GOOD">GOOD</option>
                <option value="COMPLETE">COMPLETE</option>
              </select>
            </div>
          </div>

          <div className="fg">
            <label className="fl">Required field <span>*</span></label>
            <input
              type="text"
              name="required_field"
              placeholder="phone"
              value={form.required_field}
              onChange={handleChange}
            />
            <div className="fh">
              Dot notation for nested fields (e.g. address.street)
            </div>
          </div>

          <div className="fg">
            <label className="fl">Weight (0–1) <span>*</span></label>
            <input
              type="number"
              name="weight"
              min={0}
              max={1}
              step={0.05}
              value={form.weight}
              onChange={handleChange}
            />
          </div>

          <div className="fg">
            <label className="fl">Description</label>
            <input
              type="text"
              name="description"
              placeholder="POIs should have a contact phone number"
              value={form.description}
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
            {submitting ? "Creating..." : "Create rule"}
          </button>
        </div>
      </div>
    </div>
  );
}