"use client";

import { useState } from "react";
import { createWorkerType } from "../../api";
import type { WorkerCapability } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const ALL_CAPABILITIES: WorkerCapability[] = [
  "TELEGRAM",
  "WHATSAPP",
  "WEBSITE",
  "REST_API",
  "BATCH_IMPORT",
  "MANUAL",
];

type FormState = {
  name: string;
  version: string;
  capabilities: WorkerCapability[];
  max_concurrency: number;
  is_active: boolean;
};

const defaultForm: FormState = {
  name: "",
  version: "",
  capabilities: ["TELEGRAM"],
  max_concurrency: 10,
  is_active: true,
};

export default function RegisterWorkerModal({
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "is_active") {
      setForm((prev) => ({ ...prev, is_active: checked }));
      return;
    }
    if (type === "number") {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCapabilityToggle = (cap: WorkerCapability) => {
    setForm((prev) => {
      const exists = prev.capabilities.includes(cap);
      return {
        ...prev,
        capabilities: exists
          ? prev.capabilities.filter((c) => c !== cap)
          : [...prev.capabilities, cap],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name || form.capabilities.length === 0) {
      setError("Worker name and at least one capability are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createWorkerType({ ...form, version: form.version || null });
      onCreated();
      onClose();
      setForm(defaultForm);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to register worker.",
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: 12,
          width: 440,
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
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
            Register worker type
          </span>
          <button className="btn sm ghost" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18 }}>
          {error && (
            <div
              style={{
                color: "var(--text-danger)",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div className="fr">
            <div className="fg">
              <label className="fl">
                Worker name <span>*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="telegram-scraper"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="fg">
              <label className="fl">Version</label>
              <input
                type="text"
                name="version"
                placeholder="1.0.0"
                value={form.version}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="fg">
            <label className="fl">
              Capabilities <span>*</span>
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 4,
              }}
            >
              {ALL_CAPABILITIES.map((cap) => (
                <label
                  key={cap}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.capabilities.includes(cap)}
                    onChange={() => handleCapabilityToggle(cap)}
                  />
                  {cap}
                </label>
              ))}
            </div>
          </div>

          <div className="fr">
            <div className="fg">
              <label className="fl">Max concurrency</label>
              <input
                type="number"
                name="max_concurrency"
                min={1}
                value={form.max_concurrency}
                onChange={handleChange}
              />
            </div>
            <div
              className="fg"
              style={{ display: "flex", alignItems: "flex-end" }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Active on register
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn p"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <i className="ti ti-check" />
            {submitting ? "Registering..." : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}