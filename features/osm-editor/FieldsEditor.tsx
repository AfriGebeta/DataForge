"use client";

// Renders a preset's structured fields (lib/fields.ts). Text-like inputs
// commit on blur/Enter rather than per keystroke: every commit is an
// undo-history entry, so per-keystroke commits made one typed word cost
// a dozen Ctrl+Z presses.

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADDRESS_PARTS,
  DAYS,
  DAY_LABELS,
  NAME_LANGUAGES,
  emptyWeek,
  normalizeEthiopianPhone,
  normalizeUrl,
  openingHoursProblem,
  parseOpeningHours,
  serializeOpeningHours,
  type Day,
  type Interval,
  type PresetField,
  type WeekHours,
} from "./lib/fields";
import type { OsmTags } from "./lib/graph";

// null/empty deletes the key.
export type TagPatch = Record<string, string | null>;

const inputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const smallBtn =
  "rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] px-1.5 py-0.5 text-[10px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]";

function DraftInput({
  value,
  onCommit,
  className,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [draft, setDraft] = useState(value);
  // Re-sync when the tag changes from elsewhere (undo, another field,
  // the raw tag table) — adjusting state during render, per
  // react.dev/learn/you-might-not-need-an-effect.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
      className={cn(inputClass, className)}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-0.5 block text-[10px] text-[color:var(--text-muted)]">{children}</label>;
}

// ── names ──────────────────────────────────────────────────────────

function NamesField({ tags, onPatch }: { tags: OsmTags; onPatch: (p: TagPatch) => void }) {
  // A language row the user just added has no tag yet (an empty value
  // deletes the key), so it's tracked locally until something is typed.
  const [pending, setPending] = useState<string[]>([]);
  const isPresent = (code: string) => tags[`name:${code}`] !== undefined || pending.includes(code);
  const present = NAME_LANGUAGES.filter((l) => isPresent(l.value));
  const available = NAME_LANGUAGES.filter((l) => !isPresent(l.value));
  const [adding, setAdding] = useState("");
  return (
    <div>
      <Label>Name</Label>
      <DraftInput value={tags.name ?? ""} onCommit={(v) => onPatch({ name: v })} />
      {present.map((l) => (
        <div key={l.value} className="mt-1.5 flex items-center gap-1.5">
          <span className="w-16 shrink-0 text-[10px] text-[color:var(--text-muted)]">{l.value.toUpperCase()}</span>
          <DraftInput value={tags[`name:${l.value}`] ?? ""} placeholder={l.label} onCommit={(v) => onPatch({ [`name:${l.value}`]: v })} />
          <button type="button" title={`Remove ${l.label} name`} onClick={() => {
            setPending((p) => p.filter((c) => c !== l.value));
            onPatch({ [`name:${l.value}`]: null });
          }} className="rounded p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-danger)]">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {!tags.name && present.length > 0 ? (
        <button type="button" className={cn(smallBtn, "mt-1.5")} onClick={() => onPatch({ name: tags[`name:${present[0].value}`] })}>
          Use {present[0].value.toUpperCase()} name as the default name
        </button>
      ) : null}
      {available.length > 0 ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <select
            value={adding}
            onChange={(e) => {
              const lang = e.target.value;
              setAdding("");
              if (lang) setPending((p) => [...p, lang]);
            }}
            className={cn(inputClass, "w-auto py-1")}
          >
            <option value="">+ Add a translated name…</option>
            {available.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

// ── address ────────────────────────────────────────────────────────

function AddressField({ tags, onPatch }: { tags: OsmTags; onPatch: (p: TagPatch) => void }) {
  return (
    <div>
      <Label>Address</Label>
      <div className="grid grid-cols-2 gap-1.5">
        {ADDRESS_PARTS.map((part) => (
          <div key={part.key} className={part.key === "addr:street" || part.key === "addr:suburb" ? "col-span-2" : undefined}>
            <DraftInput value={tags[part.key] ?? ""} placeholder={part.label + (part.placeholder ? ` (${part.placeholder})` : "")} onCommit={(v) => onPatch({ [part.key]: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── opening hours ──────────────────────────────────────────────────

const HOURS_PRESETS: { label: string; value: string }[] = [
  { label: "24/7", value: "24/7" },
  { label: "Mon–Fri 08:00–17:00", value: "Mo-Fr 08:00-17:00" },
  { label: "Mon–Sat 08:00–20:00", value: "Mo-Sa 08:00-20:00" },
  { label: "Every day 08:00–22:00", value: "Mo-Su 08:00-22:00" },
];

function normTimeInput(t: string): string | null {
  const m = /^([01]?\d|2[0-4]):([0-5]\d)$/.exec(t.trim());
  if (!m) return null;
  if (Number(m[1]) === 24 && m[2] !== "00") return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function HoursField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const week = parseOpeningHours(value);
  const problem = value ? openingHoursProblem(value) : null;
  const [raw, setRaw] = useState(week === null);
  // A value the grid can't faithfully represent must stay editable as text.
  const gridOk = week !== null;

  function setDay(day: Day, intervals: Interval[]) {
    const next: WeekHours = { ...(week ?? emptyWeek()), [day]: intervals };
    onCommit(serializeOpeningHours(next));
  }

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <Label>Opening hours</Label>
        {gridOk ? (
          <button type="button" className="text-[10px] text-[color:var(--text-muted)] underline" onClick={() => setRaw((r) => !r)}>
            {raw ? "Use the grid" : "Edit as text"}
          </button>
        ) : null}
      </div>

      <div className="mb-1.5 flex flex-wrap gap-1">
        {HOURS_PRESETS.map((p) => (
          <button key={p.label} type="button" className={smallBtn} onClick={() => onCommit(p.value)}>
            {p.label}
          </button>
        ))}
        {value ? (
          <button type="button" className={cn(smallBtn, "hover:text-[color:var(--text-danger)]")} onClick={() => onCommit("")}>
            Clear
          </button>
        ) : null}
      </div>

      {raw || !gridOk ? (
        <>
          <DraftInput value={value} placeholder="Mo-Fr 08:00-17:00; Sa 09:00-13:00" onCommit={onCommit} />
          {!gridOk ? <div className="mt-1 text-[10px] text-[color:var(--text-muted)]">Advanced value — kept exactly as written.</div> : null}
        </>
      ) : (
        <div className="flex flex-col gap-1">
          {DAYS.map((day) => {
            const intervals = week![day];
            const open = intervals.length > 0;
            return (
              <div key={day} className="flex items-start gap-1.5">
                <label className="flex w-12 shrink-0 items-center gap-1 pt-1.5 text-[11px] text-[color:var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={open}
                    onChange={(e) => setDay(day, e.target.checked ? [{ from: "08:00", to: "17:00" }] : [])}
                  />
                  {DAY_LABELS[day]}
                </label>
                {open ? (
                  <div className="flex flex-1 flex-col gap-1">
                    {intervals.map((iv, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <DraftInput
                          value={iv.from}
                          className="w-16 px-1.5 text-center"
                          onCommit={(v) => {
                            const t = normTimeInput(v);
                            if (t) setDay(day, intervals.map((x, j) => (j === i ? { ...x, from: t } : x)));
                          }}
                        />
                        <span className="text-[color:var(--text-muted)]">–</span>
                        <DraftInput
                          value={iv.to}
                          className="w-16 px-1.5 text-center"
                          onCommit={(v) => {
                            const t = normTimeInput(v);
                            if (t) setDay(day, intervals.map((x, j) => (j === i ? { ...x, to: t } : x)));
                          }}
                        />
                        {i === 0 && intervals.length < 2 ? (
                          <button type="button" title="Add a second interval (e.g. after a lunch break)" className="rounded p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]" onClick={() => setDay(day, [...intervals, { from: "14:00", to: "18:00" }])}>
                            <Plus className="h-3 w-3" />
                          </button>
                        ) : null}
                        {i > 0 ? (
                          <button type="button" className="rounded p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-danger)]" onClick={() => setDay(day, intervals.filter((_, j) => j !== i))}>
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                        {day === "Mo" && i === 0 ? (
                          <button
                            type="button"
                            className={smallBtn}
                            title="Copy Monday's hours to Tue–Fri"
                            onClick={() => {
                              const next: WeekHours = { ...week! };
                              for (const d of ["Tu", "We", "Th", "Fr"] as Day[]) next[d] = intervals.map((x) => ({ ...x }));
                              onCommit(serializeOpeningHours(next));
                            }}
                          >
                            → Fri
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="pt-1.5 text-[11px] text-[color:var(--text-muted)]">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {problem ? <div className="mt-1 text-[10px] text-[color:var(--text-warning)]">{problem}</div> : null}
    </div>
  );
}

// ── single-tag fields ──────────────────────────────────────────────

function SimpleField({ field, tags, onPatch }: { field: PresetField; tags: OsmTags; onPatch: (p: TagPatch) => void }) {
  const listId = useId();
  const value = tags[field.key] ?? "";
  const type = field.type ?? "text";

  if (type === "check") {
    return (
      <label className="flex items-center gap-2 text-[12px] text-[color:var(--text-primary)]">
        <input type="checkbox" checked={value === "yes"} onChange={(e) => onPatch({ [field.key]: e.target.checked ? "yes" : null })} />
        {field.label}
      </label>
    );
  }

  if (type === "combo") {
    const known = field.options?.some((o) => o.value === value);
    return (
      <div>
        <Label>{field.label}</Label>
        <DraftInput
          list={listId}
          value={value}
          placeholder={field.placeholder}
          onCommit={(v) => onPatch({ [field.key]: v })}
        />
        <datalist id={listId}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </datalist>
        {value && !known ? <div className="mt-0.5 text-[10px] text-[color:var(--text-muted)]">Custom value.</div> : null}
      </div>
    );
  }

  const inputType = type === "number" ? "text" : type === "tel" ? "tel" : type === "email" ? "email" : type === "url" ? "url" : "text";
  const suggestion = type === "tel" ? normalizeEthiopianPhone(value) : type === "url" ? normalizeUrl(value) : null;
  const numberBad = type === "number" && value !== "" && !/^\d+([.,]\d+)?( ?[a-z]+)?$/i.test(value);
  return (
    <div>
      <Label>{field.label}</Label>
      <DraftInput type={inputType} inputMode={type === "number" ? "decimal" : undefined} value={value} placeholder={field.placeholder} onCommit={(v) => onPatch({ [field.key]: v })} />
      {suggestion ? (
        <button type="button" className={cn(smallBtn, "mt-1")} onClick={() => onPatch({ [field.key]: suggestion })}>
          Use {suggestion}
        </button>
      ) : null}
      {numberBad ? <div className="mt-0.5 text-[10px] text-[color:var(--text-warning)]">Expected a number.</div> : null}
    </div>
  );
}

export default function FieldsEditor({ fields, tags, onPatch }: { fields: PresetField[]; tags: OsmTags; onPatch: (p: TagPatch) => void }) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {fields.map((field) => {
        const key = `${field.type ?? "text"}:${field.key}`;
        switch (field.type) {
          case "names":
            return <NamesField key={key} tags={tags} onPatch={onPatch} />;
          case "address":
            return <AddressField key={key} tags={tags} onPatch={onPatch} />;
          case "hours":
            return <HoursField key={key} value={tags.opening_hours ?? ""} onCommit={(v) => onPatch({ opening_hours: v })} />;
          default:
            return <SimpleField key={key} field={field} tags={tags} onPatch={onPatch} />;
        }
      })}
    </div>
  );
}
