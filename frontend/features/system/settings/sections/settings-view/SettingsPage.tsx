"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchSettings, saveSettings } from "../../api";
import type { SettingsData } from "../../types";
import SettingsSection from "./SettingsSection";

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [original, setOriginal] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
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
    try {
      await saveSettings(data);
      setOriginal(data);
      showToast("Configuration saved!");
    } catch {
      showToast("Failed to save settings.");
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

  return (
    <div>
      <SettingsSection
        data={data}
        onSensitivityChange={(v) => setData({ ...data, anomaly_sensitivity: v })}
        onMaxThreadsChange={(v) => setData({ ...data, max_threads: v })}
        onInferenceTimeoutChange={(v) => setData({ ...data, inference_timeout_ms: v })}
        onModelSelect={(id) => setData({
          ...data,
          models: data.models.map((m) => ({
            ...m,
            status: m.id === id ? "ACTIVE" : m.status === "ACTIVE" ? "AVAILABLE" : m.status,
          })),
        })}
        onRoleChange={(v) => setData({ ...data, default_role: v })}
        onManageTeam={() => showToast("Opening team management...")}
        onIntegrationToggle={(id) => setData({
          ...data,
          integrations: data.integrations.map((i) =>
            i.id === id ? { ...i, enabled: !i.enabled } : i,
          ),
        })}
        onIntegrationRenew={(id) => showToast("Renewing auth...")}
        onAlertToggle={(id) => setData({
          ...data,
          alert_preferences: data.alert_preferences.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p,
          ),
        })}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}