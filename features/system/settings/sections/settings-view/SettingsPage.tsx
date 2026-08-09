"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchSettings, saveSettings } from "../../api";
import type { AdminRole, SettingsData } from "../../types";
import SettingsSection from "./SettingsSection";

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [original, setOriginal] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSettings();
      setData(res);
      setOriginal(res);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(async () => {
    if (!data) return;
    setSaving(true);
    try {
      const saved = await saveSettings(data);
      setData(saved);
      setOriginal(saved);
      showToast("Configuration saved!");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }, [data, showToast]);

  const handleDiscard = useCallback(() => {
    if (original) {
      setData(original);
      showToast("Changes discarded");
    }
  }, [original, showToast]);

  if (loading) return <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>;
  if (error) return <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p>;
  if (!data) return null;

  const dirty = original !== null && JSON.stringify(data) !== JSON.stringify(original);

  return (
    <div>
      <SettingsSection
        data={data}
        onStaleDaysChange={(v) => setData({ ...data, staleDaysThreshold: v })}
        onRoleChange={(v: AdminRole) => setData({ ...data, defaultAdminRole: v })}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
        dirty={dirty}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}