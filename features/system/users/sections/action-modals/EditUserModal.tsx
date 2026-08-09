"use client";

import { useEffect, useState } from "react";
import { updateUser } from "../../api";
import type { AdminRole, AdminUser, UpdateUserRequest } from "../../types";

type Props = {
  user: AdminUser | null;
  onClose: () => void;
  onUpdated: () => void;
};

const ALL_ROLES: AdminRole[] = [
  "ADMIN",
  "DATA_EDITOR",
  "DATA_REVIEWER",
  "DATA_VALIDATOR",
  "VIEWER",
  "SERVICE_ACCOUNT",
];

export default function EditUserModal({ user, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<UpdateUserRequest>({
    fullName: "",
    role: "VIEWER",
    password: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        role: user.role,
        password: "",
        isActive: user.isActive,
      });
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.role) {
      setError("Role is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateUser(user.id, form);
      onUpdated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update user.");
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Edit user</span>
          <button className="btn sm ghost" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div className="fg">
            <label className="fl">Email</label>
            <input type="email" value={user.email} readOnly style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>

          <div className="fr">
            <div className="fg">
              <label className="fl">Full name</label>
              <input type="text" name="fullName" placeholder="Abebe Girma" value={form.fullName} onChange={handleChange} />
            </div>
            <div className="fg">
              <label className="fl">Role <span>*</span></label>
              <select name="role" value={form.role} onChange={handleChange} style={{ width: "100%", padding: "6px 28px 6px 10px", fontSize: 12, fontWeight: 400 }}>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="fg">
            <label className="fl">New password <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to keep current)</span></label>
            <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} />
          </div>

          <div className="fg" style={{ display: "flex", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Active
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            <i className="ti ti-check" />
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
