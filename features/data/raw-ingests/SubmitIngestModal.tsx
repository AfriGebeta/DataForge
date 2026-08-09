"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { submitIngest } from "./api";
import type { ExternalSourceType, IngestChannelType, IngestMessageType } from "./types";

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

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85 outline-none transition placeholder:text-white/30 hover:bg-white/[0.06] focus:border-[color:var(--orange-400)]/40";

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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
};

const defaultExtractedData = '{\n  "source": "manual_entry"\n}';

export default function SubmitIngestModal({ isOpen, onClose, onSubmitted }: Props) {
  const [channel, setChannel] = useState<IngestChannelType>("MANUAL");
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [sourceType, setSourceType] = useState<ExternalSourceType>("USER_SUBMISSION");
  const [messageType, setMessageType] = useState<IngestMessageType>("POI");
  const [language, setLanguage] = useState("");
  const [rawText, setRawText] = useState("");
  const [extractedData, setExtractedData] = useState(defaultExtractedData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setChannel("MANUAL");
      setChannelId("");
      setMessageId("");
      setSourceType("USER_SUBMISSION");
      setMessageType("POI");
      setLanguage("");
      setRawText("");
      setExtractedData(defaultExtractedData);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    setError(null);

    let parsedExtracted: Record<string, unknown>;
    try {
      parsedExtracted = JSON.parse(extractedData);
      if (
        typeof parsedExtracted !== "object" ||
        parsedExtracted === null ||
        Array.isArray(parsedExtracted) ||
        Object.keys(parsedExtracted).length === 0
      ) {
        throw new Error("must be a non-empty JSON object");
      }
    } catch {
      setError("Extracted data must be valid, non-empty JSON (e.g. {\"key\": \"value\"}).");
      return;
    }

    if (!rawText.trim()) {
      setError("Raw text is required.");
      return;
    }

    setSaving(true);
    try {
      await submitIngest({
        channel,
        channel_id: channelId.trim() || undefined,
        message_id: messageId.trim() || null,
        source_type: sourceType,
        message_type: messageType,
        language: language.trim() || null,
        raw_text: rawText,
        extracted_data: parsedExtracted,
      });
      onSubmitted();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to submit ingest");
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
            Submit raw ingest
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
            <Field label="Channel *">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as IngestChannelType)}
                className={inputClass}
              >
                {CHANNEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source type *">
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as ExternalSourceType)}
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
            <Field label="Channel ID">
              <input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="@addis_poi_reports"
                className={inputClass}
              />
            </Field>
            <Field label="Message ID">
              <input
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="42001"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Message type">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as IngestMessageType)}
                className={inputClass}
              >
                {MESSAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Language">
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="am"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Raw text *">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="New coffee shop just opened at Bole Road near Total station…"
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field label="Extracted data (JSON) *">
            <textarea
              value={extractedData}
              onChange={(e) => setExtractedData(e.target.value)}
              rows={4}
              className={`${inputClass} font-mono`}
            />
          </Field>

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
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
