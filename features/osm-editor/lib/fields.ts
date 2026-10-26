// Structured preset fields — the typed inputs the sidebar shows for a
// matched preset (iD calls these "fields"). Beyond plain text this
// covers what Gebeta's place data actually needs: localized names
// (Amharic/English/...), a structured address, an opening-hours editor
// that round-trips OSM's opening_hours syntax, combos, yes/no checks and
// phone/URL formatting for Ethiopia.

import type { OsmTags } from "./graph";

export type FieldType = "text" | "number" | "combo" | "check" | "tel" | "url" | "email" | "names" | "address" | "hours";

export interface FieldOption {
  value: string;
  label: string;
}

export interface PresetField {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: FieldOption[];
}

// ── localized names ────────────────────────────────────────────────

export const NAME_LANGUAGES: FieldOption[] = [
  { value: "am", label: "Amharic (አማርኛ)" },
  { value: "en", label: "English" },
  { value: "om", label: "Afaan Oromoo" },
  { value: "ti", label: "Tigrinya (ትግርኛ)" },
  { value: "so", label: "Somali" },
  { value: "aa", label: "Afar" },
  { value: "ar", label: "Arabic" },
];

// ── address ────────────────────────────────────────────────────────

export const ADDRESS_PARTS: { key: string; label: string; placeholder?: string }[] = [
  { key: "addr:housenumber", label: "House no." },
  { key: "addr:street", label: "Street" },
  { key: "addr:suburb", label: "Neighborhood" },
  { key: "addr:city", label: "City", placeholder: "Addis Ababa" },
  { key: "addr:postcode", label: "Postcode" },
];

// ── combos ─────────────────────────────────────────────────────────

const opts = (...values: string[]): FieldOption[] => values.map((v) => ({ value: v, label: v.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) }));

export const CUISINE_OPTIONS = opts("ethiopian", "coffee_shop", "pizza", "burger", "chicken", "sandwich", "seafood", "italian", "indian", "chinese", "international", "regional", "vegetarian", "fish", "kebab", "ice_cream");
export const SURFACE_OPTIONS = opts("asphalt", "paved", "concrete", "paving_stones", "cobblestone", "compacted", "gravel", "unpaved", "dirt", "ground", "sand");
export const ONEWAY_OPTIONS: FieldOption[] = [
  { value: "yes", label: "Yes (with the line's direction)" },
  { value: "-1", label: "Yes (against the line's direction)" },
  { value: "no", label: "No" },
];
export const BUILDING_OPTIONS = opts("yes", "house", "apartments", "residential", "commercial", "retail", "office", "industrial", "warehouse", "school", "hospital", "church", "mosque", "public", "garage", "roof", "construction");
export const WHEELCHAIR_OPTIONS = opts("yes", "limited", "no");
export const HIGHWAY_OPTIONS = opts("motorway", "trunk", "primary", "secondary", "tertiary", "residential", "unclassified", "service", "track", "path", "footway", "pedestrian", "steps");
export const BRIDGE_OPTIONS = opts("yes", "viaduct", "movable");
export const TUNNEL_OPTIONS = opts("yes", "culvert", "building_passage");
export const ROOF_OPTIONS = opts("flat", "gabled", "hipped", "pyramidal", "skillion", "dome");
export const SPORT_OPTIONS = opts("soccer", "basketball", "volleyball", "tennis", "athletics", "swimming", "running", "table_tennis");

// ── ready-made field sets ──────────────────────────────────────────

export const F = {
  names: { key: "name", label: "Name", type: "names" } as PresetField,
  address: { key: "addr:*", label: "Address", type: "address" } as PresetField,
  hours: { key: "opening_hours", label: "Opening hours", type: "hours" } as PresetField,
  phone: { key: "phone", label: "Phone", type: "tel", placeholder: "+251 9…" } as PresetField,
  website: { key: "website", label: "Website", type: "url", placeholder: "https://…" } as PresetField,
  email: { key: "email", label: "Email", type: "email" } as PresetField,
  wheelchair: { key: "wheelchair", label: "Wheelchair access", type: "combo", options: WHEELCHAIR_OPTIONS } as PresetField,
  operator: { key: "operator", label: "Operator" } as PresetField,
  cuisine: { key: "cuisine", label: "Cuisine", type: "combo", options: CUISINE_OPTIONS } as PresetField,
  takeaway: { key: "takeaway", label: "Takeaway", type: "check" } as PresetField,
  delivery: { key: "delivery", label: "Delivery", type: "check" } as PresetField,
  emergency: { key: "emergency", label: "Emergency services", type: "check" } as PresetField,
  atm: { key: "atm", label: "Has an ATM", type: "check" } as PresetField,
  ref: { key: "ref", label: "Reference / road number" } as PresetField,
  surface: { key: "surface", label: "Surface", type: "combo", options: SURFACE_OPTIONS } as PresetField,
  oneway: { key: "oneway", label: "One-way", type: "combo", options: ONEWAY_OPTIONS } as PresetField,
  lanes: { key: "lanes", label: "Lanes", type: "number" } as PresetField,
  maxspeed: { key: "maxspeed", label: "Speed limit (km/h)", type: "number" } as PresetField,
  lit: { key: "lit", label: "Street lighting", type: "check" } as PresetField,
  bridge: { key: "bridge", label: "Bridge", type: "combo", options: BRIDGE_OPTIONS } as PresetField,
  tunnel: { key: "tunnel", label: "Tunnel", type: "combo", options: TUNNEL_OPTIONS } as PresetField,
  building: { key: "building", label: "Building type", type: "combo", options: BUILDING_OPTIONS } as PresetField,
  levels: { key: "building:levels", label: "Floors", type: "number" } as PresetField,
  height: { key: "height", label: "Height (m)", type: "number" } as PresetField,
  roof: { key: "roof:shape", label: "Roof shape", type: "combo", options: ROOF_OPTIONS } as PresetField,
  sport: { key: "sport", label: "Sport", type: "combo", options: SPORT_OPTIONS } as PresetField,
  capacity: { key: "capacity", label: "Capacity", type: "number" } as PresetField,
  fee: { key: "fee", label: "Fee", type: "check" } as PresetField,
};

// ── opening hours ──────────────────────────────────────────────────

export const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" };

export interface Interval {
  from: string; // "HH:MM"
  to: string; // "HH:MM", "24:00" allowed
}

// Per-day list of open intervals; an empty list means closed.
export type WeekHours = Record<Day, Interval[]>;

export function emptyWeek(): WeekHours {
  return { Mo: [], Tu: [], We: [], Th: [], Fr: [], Sa: [], Su: [] };
}

const TIME = /^([01]?\d|2[0-4]):([0-5]\d)$/;

function normTime(t: string): string | null {
  const m = TIME.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  if (h === 24 && m[2] !== "00") return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function expandDays(spec: string): Day[] | null {
  const out = new Set<Day>();
  for (const part of spec.split(",")) {
    const p = part.trim();
    if (!p) return null;
    const [a, b] = p.split("-").map((s) => s.trim());
    const ai = DAYS.indexOf(a as Day);
    if (ai === -1) return null;
    if (b === undefined) {
      out.add(DAYS[ai]);
      continue;
    }
    const bi = DAYS.indexOf(b as Day);
    if (bi === -1) return null;
    for (let i = ai; ; i = (i + 1) % 7) {
      out.add(DAYS[i]);
      if (i === bi) break;
    }
  }
  return DAYS.filter((d) => out.has(d));
}

function parseIntervals(spec: string): Interval[] | null {
  const out: Interval[] = [];
  for (const part of spec.split(",")) {
    const [f, t] = part.trim().split("-");
    if (f === undefined || t === undefined) return null;
    const from = normTime(f);
    const to = normTime(t);
    if (!from || !to) return null;
    out.push({ from, to });
  }
  return out;
}

// Parses the common subset of OSM opening_hours the structured editor
// can represent faithfully. Anything richer (public holidays, months,
// sunrise/sunset, week numbers...) returns null so the UI falls back to
// the raw text and never silently rewrites a value it doesn't understand.
export function parseOpeningHours(value: string): WeekHours | null {
  const v = value.trim();
  if (v === "") return emptyWeek();
  const week = emptyWeek();
  if (v === "24/7") {
    for (const d of DAYS) week[d] = [{ from: "00:00", to: "24:00" }];
    return week;
  }
  for (const raw of v.split(";")) {
    const rule = raw.trim();
    if (!rule) continue;
    const m = /^(?:([A-Za-z][A-Za-z,\- ]*?)\s+)?(off|closed|[\d:,\- ]+)$/.exec(rule);
    if (!m) return null;
    const days = m[1] ? expandDays(m[1]) : [...DAYS];
    if (!days) return null;
    const timesSpec = m[2].trim();
    const intervals = timesSpec === "off" || timesSpec === "closed" ? [] : parseIntervals(timesSpec);
    if (!intervals) return null;
    for (const d of days) week[d] = intervals; // later rules override earlier ones
  }
  return week;
}

function intervalKey(iv: Interval[]): string {
  return iv.map((i) => `${i.from}-${i.to}`).join(",");
}

function collapseRuns(days: Day[]): string {
  const runs: string[] = [];
  let s = 0;
  while (s < days.length) {
    let e = s;
    while (e + 1 < days.length && DAYS.indexOf(days[e + 1]) === DAYS.indexOf(days[e]) + 1) e++;
    // 3+ consecutive days read best as a range, 1-2 as a list
    runs.push(e - s >= 2 ? `${days[s]}-${days[e]}` : days.slice(s, e + 1).join(","));
    s = e + 1;
  }
  return runs.join(",");
}

// Groups days that share identical hours into one rule: "Mo-Fr 08:00-17:00; Sa 09:00-13:00".
// Closed days are simply omitted (OSM reads unlisted days as closed).
export function serializeOpeningHours(week: WeekHours): string {
  const keys = DAYS.map((d) => intervalKey(week[d].filter((i) => i.from && i.to)));
  if (keys.every((k) => k === "")) return "";
  if (keys.every((k) => k === "00:00-24:00")) return "24/7";
  if (keys.every((k) => k === keys[0])) return `Mo-Su ${keys[0]}`;
  const groups = new Map<string, Day[]>();
  DAYS.forEach((d, i) => {
    if (keys[i] === "") return;
    groups.set(keys[i], [...(groups.get(keys[i]) ?? []), d]);
  });
  return [...groups].map(([key, days]) => `${collapseRuns(days)} ${key}`).join("; ");
}

// A deliberately lenient sanity check (not a full opening_hours parser):
// flags only values that are clearly broken — a time token out of range,
// a start after an end on a same-day interval, or an unknown weekday
// abbreviation — so legitimate complex syntax never trips a false alarm.
export function openingHoursProblem(value: string): string | null {
  for (const m of value.matchAll(/(\d{1,2}):(\d{2})/g)) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 24 || min > 59 || (h === 24 && min !== 0)) return `"${m[0]}" is not a valid time.`;
  }
  for (const m of value.matchAll(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/g)) {
    const a = Number(m[1]) * 60 + Number(m[2]);
    const b = Number(m[3]) * 60 + Number(m[4]);
    // overnight ranges (22:00-02:00) are legitimate; only reject a zero-length one
    if (a === b) return `"${m[0]}" starts and ends at the same time.`;
  }
  for (const m of value.matchAll(/\b([A-Z][a-z]{1,2})\b(?=[ ,-]*\d|\s*[-,])/g)) {
    const t = m[1];
    if (["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", "PH", "SH", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "off"].includes(t)) continue;
    if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(t)) return `Use "${t.slice(0, 2)}" instead of "${t}".`;
  }
  return null;
}

// ── phone / URL formatting (Ethiopia) ──────────────────────────────

// Ethiopian national numbers (0911…, 011 …) become +251 international
// format; anything already international or non-matching is left alone.
export function normalizeEthiopianPhone(raw: string): string | null {
  let changed = false;
  const out = raw.split(";").map((p) => {
    const digits = p.trim().replace(/[\s\-().]/g, "");
    let nine: string | null = null;
    if (/^0\d{9}$/.test(digits)) nine = digits.slice(1);
    else if (/^(\+?251)\d{9}$/.test(digits)) nine = digits.replace(/^\+?251/, "");
    if (!nine) return p.trim();
    const formatted = `+251 ${nine.slice(0, 2)} ${nine.slice(2, 5)} ${nine.slice(5)}`;
    if (formatted !== p.trim()) changed = true;
    return formatted;
  });
  return changed ? out.join("; ") : null;
}

export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v || /^[a-z][a-z0-9+.-]*:\/\//i.test(v) || v.includes(" ")) return null;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)) return `https://${v}`;
  return null;
}

// Tags the Address field owns — used to decide whether it should render
// as "filled".
export function addressKeys(): string[] {
  return ADDRESS_PARTS.map((p) => p.key);
}

export function hasAnyAddress(tags: OsmTags): boolean {
  return addressKeys().some((k) => !!tags[k]);
}
