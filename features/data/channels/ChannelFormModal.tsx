"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { createChannelConfig, updateChannelConfig } from "./api";
import type {
  ChannelConfig,
  CreateChannelConfigRequest,
  ExternalSourceType,
  IngestChannelType,
  IngestMessageType,
  ScheduleType,
} from "./types";

const CHANNEL_TYPES: IngestChannelType[] = [
  "TELEGRAM_BOT",
  "TELEGRAM_WEBHOOK",
  "WHATSAPP_WEBHOOK",
  "REST_API",
  "BATCH_IMPORT",
  "MANUAL",
];

const MESSAGE_TYPES: IngestMessageType[] = [
  "POI",
  "REAL_ESTATE",
  "ROAD",
  "TRANSIT",
  "ADMIN_BOUNDARY",
  "NATURAL",
  "UNKNOWN",
];

const SOURCE_TYPES: ExternalSourceType[] = [
  "OSM",
  "WIKIDATA",
  "WIKIPEDIA",
  "GEONAMES",
  "GOVERNMENT",
  "MUNICIPALITY",
  "USER_SUBMISSION",
  "PARTNER_IMPORT",
  "MANUAL_ENTRY",
  "THIRD_PARTY",
  "UNKNOWN",
];

const SCHEDULE_TYPES: ScheduleType[] = ["MANUAL", "CRON", "INTERVAL", "WEBHOOK", "LONG_POLL"];

type FormState = {
  channel_id: string;
  channel_name: string;
  channel: IngestChannelType;
  default_message_type: IngestMessageType | "";
  default_language: string;
  default_source_type: ExternalSourceType;
  price_bracket: string;
  is_active: boolean;
  is_trusted: boolean;
  expected_frequency_hours: string;
  webhook_url: string;
  schedule_type: ScheduleType;
  cron_expr: string;
  poll_interval_sec: string;
  timezone: string;
};

const emptyForm: FormState = {
  channel_id: "",
  channel_name: "",
  channel: "REST_API",
  default_message_type: "",
  default_language: "en",
  default_source_type: "USER_SUBMISSION",
  price_bracket: "",
  is_active: true,
  is_trusted: false,
  expected_frequency_hours: "",
  webhook_url: "",
  schedule_type: "MANUAL",
  cron_expr: "",
  poll_interval_sec: "",
  timezone: "UTC",
};

function toForm(ch: ChannelConfig): FormState {
  return {
    channel_id: ch.channel_id,
    channel_name: ch.channel_name ?? "",
    channel: ch.channel,
    default_message_type: ch.default_message_type ?? "",
    default_language: ch.default_language ?? "",
    default_source_type: ch.default_source_type,
    price_bracket: ch.price_bracket ?? "",
    is_active: ch.is_active,
    is_trusted: ch.is_trusted,
    expected_frequency_hours: ch.expected_frequency_hours?.toString() ?? "",
    webhook_url: ch.webhook_url ?? "",
    schedule_type: ch.schedule_type,
    cron_expr: ch.cron_expr ?? "",
    poll_interval_sec: ch.poll_interval_sec?.toString() ?? "",
    timezone: ch.timezone,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85 outline-none transition placeholder:text-white/30 hover:bg-white/[0.06] focus:border-[color:var(--orange-400)]/40";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: ChannelConfig | null;
};

export default function ChannelFormModal({ isOpen, onClose, onSaved, editing }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(editing ? toForm(editing) : emptyForm);
      setError(null);
    }
  }, [isOpen, editing]);

  if (!isOpen) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload: CreateChannelConfigRequest = {
        channel_id: form.channel_id.trim(),
        channel_name: form.channel_name.trim() || null,
        channel: form.channel,
        default_message_type: form.default_message_type || null,
        default_language: form.default_language.trim() || null,
        default_source_type: form.default_source_type,
        price_bracket: form.price_bracket.trim() || null,
        is_active: form.is_active,
        is_trusted: form.is_trusted,
        expected_frequency_hours: form.expected_frequency_hours
          ? Number(form.expected_frequency_hours)
          : null,
        webhook_url: form.webhook_url.trim() || null,
        schedule_type: form.schedule_type,
        cron_expr: form.cron_expr.trim() || null,
        poll_interval_sec: form.poll_interval_sec ? Number(form.poll_interval_sec) : null,
        timezone: form.timezone.trim() || "UTC",
      };

      if (editing) {
        const { channel_id: _channelId, channel: _channel, ...updatable } = payload;
        void _channelId;
        void _channel;
        await updateChannelConfig(editing.id, updatable);
      } else {
        await createChannelConfig(payload);
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save channel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="font-display text-[14px] font-semibold text-white/90">
            {editing ? "Edit channel config" : "Create channel config"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel ID *">
              <input
                value={form.channel_id}
                onChange={(e) => set("channel_id", e.target.value)}
                placeholder="telegram_news_feed"
                disabled={Boolean(editing)}
                className={inputClass}
              />
            </Field>
            <Field label="Display name">
              <input
                value={form.channel_name}
                onChange={(e) => set("channel_name", e.target.value)}
                placeholder="Telegram News Feed"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel type *">
              <select
                value={form.channel}
                onChange={(e) => set("channel", e.target.value as IngestChannelType)}
                disabled={Boolean(editing)}
                className={inputClass}
              >
                {CHANNEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default source type *">
              <select
                value={form.default_source_type}
                onChange={(e) => set("default_source_type", e.target.value as ExternalSourceType)}
                className={inputClass}
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Default message type">
              <select
                value={form.default_message_type}
                onChange={(e) => set("default_message_type", e.target.value as IngestMessageType | "")}
                className={inputClass}
              >
                <option value="">—</option>
                {MESSAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default language">
              <input
                value={form.default_language}
                onChange={(e) => set("default_language", e.target.value)}
                placeholder="en"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price bracket">
              <input
                value={form.price_bracket}
                onChange={(e) => set("price_bracket", e.target.value)}
                placeholder="FREE"
                className={inputClass}
              />
            </Field>
            <Field label="Expected frequency (hours)">
              <input
                type="number"
                min={1}
                value={form.expected_frequency_hours}
                onChange={(e) => set("expected_frequency_hours", e.target.value)}
                placeholder="24"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Webhook URL">
            <input
              value={form.webhook_url}
              onChange={(e) => set("webhook_url", e.target.value)}
              placeholder="https://api.example.com/webhooks/telegram"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Schedule type *">
              <select
                value={form.schedule_type}
                onChange={(e) => set("schedule_type", e.target.value as ScheduleType)}
                className={inputClass}
              >
                {SCHEDULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Timezone *">
              <input
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                placeholder="UTC"
                className={inputClass}
              />
            </Field>
          </div>

          {form.schedule_type === "INTERVAL" ? (
            <Field label="Poll interval (seconds)">
              <input
                type="number"
                min={5}
                value={form.poll_interval_sec}
                onChange={(e) => set("poll_interval_sec", e.target.value)}
                placeholder="30"
                className={inputClass}
              />
            </Field>
          ) : null}

          {form.schedule_type === "CRON" ? (
            <Field label="Cron expression">
              <input
                value={form.cron_expr}
                onChange={(e) => set("cron_expr", e.target.value)}
                placeholder="*/15 * * * *"
                className={inputClass}
              />
            </Field>
          ) : null}

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[12px] text-white/75">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-3.5 w-3.5 accent-[color:var(--orange-400)]"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-[12px] text-white/75">
              <input
                type="checkbox"
                checked={form.is_trusted}
                onChange={(e) => set("is_trusted", e.target.checked)}
                className="h-3.5 w-3.5 accent-[color:var(--orange-400)]"
              />
              Trusted (skips human review)
            </label>
          </div>

          {error ? (
            <div className="rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-danger)]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || !form.channel_id.trim() || !form.timezone.trim()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {editing ? "Save changes" : "Create channel"}
          </button>
        </div>
      </div>
    </div>
  );
}
