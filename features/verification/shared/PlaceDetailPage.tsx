"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import ToastNotification from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { createCategory, createSlug, fetchParentCategories, getLocalizedName } from "@/features/category/categories/api";
import type { Category } from "@/features/category/categories/types";
import { fetchAddressLevels } from "@/features/address/nodes/api";
import { addressLevelName, type AddressLevelDef } from "@/features/address/nodes/types";
import {
  fetchAdminLevelChain,
  fetchPlace,
  fetchPlaceFlags,
  refreshPlace,
  resolveFlag,
  reviewPlace,
  saveAdminLevelChain,
  updatePlace,
} from "./api";
import {
  ACCESS_TYPES,
  ATTRIBUTE_VALUE_TYPES,
  COMPLETENESS_LEVELS,
  CONTACT_TYPES,
  GEOCODE_METHODS,
  PLACE_TYPES,
  WEEKDAYS,
  type AdminLevelChainItem,
  type PlaceDetail,
  type PlaceFlag,
  type UpdateContactPayload,
  type UpdateImagePayload,
  type UpdateOpeningHourPayload,
  type UpdatePlacePayload,
} from "./types";

// "manage" is the generic Place-menu entry point (Update Place) — same editor,
// no Approve/Reject actions since the place isn't necessarily in review.
type Mode = "queue" | "geographic" | "manage";

type Props = {
  placeId: number;
  mode: Mode;
  backHref: string;
  backLabel: string;
};

// ── Small field primitives — every input in this page uses one of these ────

const inputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 font-mono text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const selectClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";

function FieldLabel({ children, flagged }: { children: React.ReactNode; flagged?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
      {children}
      {flagged ? (
        <Badge
          variant="outline"
          className="gap-1 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-1.5 py-0 text-[9px] text-[color:var(--text-danger)]"
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          flagged
        </Badge>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {allowEmpty ? <option value="">—</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function CategoryField({
  categoryId,
  categories,
  onChange,
  onCategoryCreated,
}: {
  categoryId: string;
  categories: Category[];
  onChange: (id: string) => void;
  onCategoryCreated: (category: Category) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = categories.find((c) => c.id === categoryId);
  const label = !categoryId
    ? "— none —"
    : selected
      ? getLocalizedName(selected, "en")
      : `Unknown category (${categoryId})`;

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>Category</FieldLabel>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            inputClass,
            "flex-1 truncate font-sans",
            !categoryId && "text-[color:var(--text-muted)]",
          )}
        >
          {label}
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[11.5px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
        >
          <Pencil className="h-3.5 w-3.5" />
          Change
        </button>
      </div>
      <CategoryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        categories={categories}
        currentId={categoryId}
        onSelect={(id) => {
          onChange(id);
          setPickerOpen(false);
        }}
        onCategoryCreated={onCategoryCreated}
      />
    </div>
  );
}

function CategoryPickerModal({
  isOpen,
  onClose,
  categories,
  currentId,
  onSelect,
  onCategoryCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentId: string;
  onSelect: (id: string) => void;
  onCategoryCreated: (category: Category) => void;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setCreateError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const q = trimmedQuery.toLowerCase();
  const results = q
    ? categories.filter(
        (c) =>
          getLocalizedName(c, "en").toLowerCase().includes(q) ||
          (c.name.am ?? "").toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q),
      )
    : categories;

  // Only offer "create" once there's a query with no exact name match —
  // a partial match (e.g. "Cafe" matching "Cafes") should still just filter,
  // not tempt the admin into creating a near-duplicate category.
  const exactMatch = q ? categories.some((c) => getLocalizedName(c, "en").toLowerCase() === q) : false;
  const offerCreate = trimmedQuery.length > 0 && !exactMatch;

  async function handleCreate() {
    if (!trimmedQuery || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createCategory({
        nameEn: trimmedQuery,
        nameAm: "",
        slug: createSlug(trimmedQuery),
        parentId: "",
        icon: "",
      });
      onCategoryCreated(created);
      onSelect(created.id);
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Failed to create category.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[color:var(--text-secondary)]" />
            <span className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
              Select Category
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-[color:var(--border)] px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories by name or slug…"
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
              style={{ paddingLeft: 32, paddingRight: 12 }}
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-2 py-2">
          <button
            type="button"
            onClick={() => onSelect("")}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] transition hover:bg-[color:var(--surface-3)]",
              !currentId
                ? "bg-[color:var(--orange-500)]/12 text-[color:var(--orange-400)]"
                : "text-[color:var(--text-secondary)]",
            )}
          >
            — none —
            {!currentId ? <Check className="h-3.5 w-3.5" /> : null}
          </button>

          {results.length === 0 && !offerCreate ? (
            <div className="px-3 py-6 text-center text-[11.5px] text-[color:var(--text-muted)]">
              No categories match.
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[12px] transition hover:bg-[color:var(--surface-3)]",
                  c.id === currentId
                    ? "bg-[color:var(--orange-500)]/12 text-[color:var(--orange-400)]"
                    : "text-[color:var(--text-primary)]",
                )}
              >
                <span className="truncate">
                  {getLocalizedName(c, "en")}
                  <span className="ml-1.5 text-[10.5px] text-[color:var(--text-muted)]">{c.slug}</span>
                </span>
                {c.id === currentId ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>
            ))
          )}

          {offerCreate ? (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-[color:var(--border-strong)] px-3 py-2 text-left text-[12px] text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/10 disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <Plus className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">
                {creating ? "Creating…" : (
                  <>
                    Create category <span className="font-semibold">&ldquo;{trimmedQuery}&rdquo;</span>
                  </>
                )}
              </span>
            </button>
          ) : null}

          {createError ? (
            <div className="mt-2 px-3 text-[11px] text-[color:var(--text-danger)]">{createError}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11.5px] text-[color:var(--text-secondary)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-[color:var(--border-strong)] bg-[color:var(--surface-1)] accent-[color:var(--orange-400)]"
      />
      {label}
    </label>
  );
}

function Section({
  title,
  icon: Icon,
  flagged,
  children,
}: {
  title: string;
  icon: typeof MapPin;
  flagged?: boolean;
  children: React.ReactNode;
}) {
  return (
    <GlassCard tone={flagged ? "danger" : "neutral"}>
      <CardHeader className="flex flex-row items-center gap-2 px-6 pb-0 pt-6">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            flagged
              ? "bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25"
              : "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] ring-1 ring-inset ring-[color:var(--border)]",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">{title}</CardTitle>
        {flagged ? (
          <Badge
            variant="outline"
            className="ml-auto gap-1 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 text-[10px] text-[color:var(--text-danger)]"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            Needs attention
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-5">{children}</CardContent>
    </GlassCard>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] transition hover:bg-[color:var(--text-danger)]/12 hover:text-[color:var(--text-danger)]"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[11.5px] text-[color:var(--text-muted)] transition hover:border-[color:var(--orange-400)]/40 hover:text-[color:var(--text-primary)]"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ── Date helpers: <input type="date"> works in yyyy-mm-dd, the API wants
// full RFC3339 timestamps (or nothing at all if the field was left blank).

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleString();
}

// ── Attribute value coercion — matches the valueType the reviewer picks.

function coerceAttributeValue(raw: string, valueType: string): unknown {
  switch (valueType) {
    case "NUMBER": {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    case "BOOLEAN":
      return raw === "true";
    case "JSON":
    case "ARRAY":
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}

type ContactDraft = UpdateContactPayload;
type HourDraft = UpdateOpeningHourPayload;
type AttributeDraft = { key: string; value: string; valueType: string };
type ImageDraft = UpdateImagePayload;

type FormState = {
  placeType: string;
  accessType: string;
  categoryId: string;
  isActive: boolean;
  latitude: string;
  longitude: string;
  geocodeConfidence: string;
  geocodeMethod: string;
  elevationMeters: string;
  areaSqMeters: string;
  buildingLevels: string;
  establishedAt: string;
  dateClosed: string;
  placeRank: string;
  displayRank: string;
  minZoom: string;
  maxZoom: string;
  osmRank: string;
  completenessLevel: string;
  countryIso2: string;
  countryIso3: string;
  streetName: string;
  streetNumber: string;
  blockNumber: string;
  buildingNumber: string;
  buildingName: string;
  unitNumber: string;
  floorNumber: string;
  postcode: string;
  postBox: string;
  formattedFull: string;
  formattedShort: string;
  landmarkDescription: string;
  neighborhood: string;
  woredaNumber: string;
  kebeleNumber: string;
  isVerified: boolean;
};

const emptyForm: FormState = {
  placeType: "",
  accessType: "",
  categoryId: "",
  isActive: true,
  latitude: "",
  longitude: "",
  geocodeConfidence: "",
  geocodeMethod: "",
  elevationMeters: "",
  areaSqMeters: "",
  buildingLevels: "",
  establishedAt: "",
  dateClosed: "",
  placeRank: "",
  displayRank: "",
  minZoom: "",
  maxZoom: "",
  osmRank: "",
  completenessLevel: "",
  countryIso2: "",
  countryIso3: "",
  streetName: "",
  streetNumber: "",
  blockNumber: "",
  buildingNumber: "",
  buildingName: "",
  unitNumber: "",
  floorNumber: "",
  postcode: "",
  postBox: "",
  formattedFull: "",
  formattedShort: "",
  landmarkDescription: "",
  neighborhood: "",
  woredaNumber: "",
  kebeleNumber: "",
  isVerified: false,
};

function numOrUndef(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function intOrUndef(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}

/** Serializes the editable form state for cheap dirty-checking against a baseline. */
function snapshotOf(
  form: FormState,
  names: Record<string, string>,
  contacts: ContactDraft[],
  hours: HourDraft[],
  attributes: AttributeDraft[],
  images: ImageDraft[],
  chainDraft: { level: number; name: string }[],
): string {
  return JSON.stringify({ form, names, contacts, hours, attributes, images, chainDraft });
}

export default function PlaceDetailPage({ placeId, mode, backHref, backLabel }: Props) {
  const router = useRouter();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [flags, setFlags] = useState<PlaceFlag[]>([]);
  const [chain, setChain] = useState<AdminLevelChainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message: toastMessage, visible: toastVisible, showToast: setToast } = useToast();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [names, setNames] = useState<Record<string, string>>({});
  const [newLangCode, setNewLangCode] = useState("");
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [hours, setHours] = useState<HourDraft[]>([]);
  const [attributes, setAttributes] = useState<AttributeDraft[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [chainDraft, setChainDraft] = useState<{ level: number; name: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addressLevels, setAddressLevels] = useState<AddressLevelDef[]>([]);

  // Snapshot of form/names/contacts/hours/attributes/images/chainDraft as of
  // the last successful load or save. Compared (during render, see isDirty
  // below) against a live snapshot to tell whether there are pending edits,
  // so Approve/Reject can save them first instead of silently discarding them.
  const [baseline, setBaseline] = useState<string>("");

  useEffect(() => {
    void fetchParentCategories().then(setCategories);
    void fetchAddressLevels().then(setAddressLevels);
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    const p = await fetchPlace(placeId);
    setPlace(p);
    if (p) {
      const nameMap: Record<string, string> = {};
      p.names.forEach((n) => {
        nameMap[n.languageCode] = n.name;
      });

      const nextForm: FormState = {
        placeType: p.placeType ?? "",
        accessType: p.accessType ?? "",
        categoryId: p.categoryId ?? "",
        isActive: p.isActive,
        latitude: String(p.latitude),
        longitude: String(p.longitude),
        geocodeConfidence: p.geocodeConfidence != null ? String(p.geocodeConfidence) : "",
        geocodeMethod: p.geocodeMethod ?? "",
        elevationMeters: p.elevationMeters != null ? String(p.elevationMeters) : "",
        areaSqMeters: p.areaSqMeters != null ? String(p.areaSqMeters) : "",
        buildingLevels: p.buildingLevels != null ? String(p.buildingLevels) : "",
        establishedAt: isoToDateInput(p.establishedAt),
        dateClosed: isoToDateInput(p.dateClosed),
        placeRank: String(p.placeRank),
        displayRank: String(p.displayRank),
        minZoom: String(p.minZoom),
        maxZoom: String(p.maxZoom),
        osmRank: p.osmRank != null ? String(p.osmRank) : "",
        completenessLevel: p.completenessLevel ?? "",
        countryIso2: p.address?.countryIso2 ?? "ET",
        countryIso3: p.address?.countryIso3 ?? "",
        streetName: p.address?.streetName?.en ?? "",
        streetNumber: p.address?.streetNumber ?? "",
        blockNumber: p.address?.blockNumber ?? "",
        buildingNumber: p.address?.buildingNumber ?? "",
        buildingName: p.address?.buildingName ?? "",
        unitNumber: p.address?.unitNumber ?? "",
        floorNumber: p.address?.floorNumber ?? "",
        postcode: p.address?.postcode ?? "",
        postBox: p.address?.postBox ?? "",
        formattedFull: p.address?.formattedFull?.en ?? "",
        formattedShort: p.address?.formattedShort?.en ?? "",
        landmarkDescription: p.address?.landmarkDescription ?? "",
        neighborhood: p.address?.neighborhood ?? "",
        woredaNumber: p.address?.woredaNumber ?? "",
        kebeleNumber: p.address?.kebeleNumber ?? "",
        isVerified: p.address?.isVerified ?? false,
      };

      const nextContacts = (p.contacts ?? []).map((c) => ({ type: c.type, value: c.value, label: c.label }));
      const nextHours = (p.openingHours ?? []).map((h) => ({
        weekday: h.weekday,
        opensAt: h.opensAt,
        closesAt: h.closesAt,
        isClosed: h.isClosed,
        label: h.label,
      }));
      const nextAttributes = (p.attributes ?? []).map((a) => ({
        key: a.key,
        value: typeof a.value === "string" ? a.value : JSON.stringify(a.value),
        valueType: a.valueType,
      }));
      const nextImages = (p.images ?? []).map((i) => ({ url: i.url, isPrimary: i.isPrimary, blurhash: i.blurhash }));

      setNames(nameMap);
      setForm(nextForm);
      setContacts(nextContacts);
      setHours(nextHours);
      setAttributes(nextAttributes);
      setImages(nextImages);

      const f = await fetchPlaceFlags(placeId);
      setFlags(f);

      let nextChainDraft: { level: number; name: string }[];
      if (p.address?.id) {
        const rows = await fetchAdminLevelChain(p.address.id);
        setChain(rows);
        nextChainDraft =
          rows.length > 0
            ? rows.map((r) => ({ level: r.level, name: r.name.en ?? Object.values(r.name)[0] ?? "" }))
            : [0, 1, 2, 3].map((level) => ({ level, name: "" }));
      } else {
        setChain([]);
        nextChainDraft = [];
      }
      setChainDraft(nextChainDraft);

      setBaseline(snapshotOf(nextForm, nameMap, nextContacts, nextHours, nextAttributes, nextImages, nextChainDraft));
    } else {
      setBaseline("");
    }
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty =
    baseline !== "" && baseline !== snapshotOf(form, names, contacts, hours, attributes, images, chainDraft);

  const geoFlagged =
    place?.aiValues?.aiGeoValid === false ||
    flags.some((f) => f.category === "GEOMETRY" && !f.is_resolved);
  const nameFlagged =
    place?.aiValues?.aiNameValid === false ||
    flags.some((f) => f.category === "NAME" && !f.is_resolved);
  const hierarchyFlagged = flags.some(
    (f) => (f.category === "HIERARCHY" || f.category === "ADDRESS") && !f.is_resolved,
  );

  // Builds the update payload from current form state and PUTs it. Shared by
  // handleSave and handleDecision (the latter uses it to persist pending
  // edits before approving/rejecting, instead of silently discarding them).
  async function saveChanges(): Promise<boolean> {
    if (!place) return false;
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setToast("Latitude/longitude must be numbers.");
      return false;
    }
    const hasOtherAddressInput = [
      form.countryIso3,
      form.streetName,
      form.streetNumber,
      form.blockNumber,
      form.buildingNumber,
      form.buildingName,
      form.unitNumber,
      form.floorNumber,
      form.postcode,
      form.postBox,
      form.formattedFull,
      form.formattedShort,
      form.landmarkDescription,
      form.neighborhood,
      form.woredaNumber,
      form.kebeleNumber,
    ].some((v) => v.trim());
    if (!form.countryIso2.trim() && hasOtherAddressInput) {
      setToast("Country (ISO2) is required to save any Address field (e.g. Neighborhood) — the whole Address section is otherwise dropped.");
      return false;
    }
    setSaving(true);

    const payload: UpdatePlacePayload = {
      placeType: form.placeType || undefined,
      accessType: form.accessType || undefined,
      categoryId: form.categoryId.trim() ? form.categoryId.trim() : null,
      latitude: lat,
      longitude: lng,
      geocodeConfidence: numOrUndef(form.geocodeConfidence),
      geocodeMethod: form.geocodeMethod || undefined,
      elevationMeters: numOrUndef(form.elevationMeters),
      areaSqMeters: numOrUndef(form.areaSqMeters),
      buildingLevels: intOrUndef(form.buildingLevels),
      establishedAt: dateInputToIso(form.establishedAt),
      dateClosed: dateInputToIso(form.dateClosed),
      isActive: form.isActive,
      placeRank: intOrUndef(form.placeRank),
      displayRank: intOrUndef(form.displayRank),
      minZoom: intOrUndef(form.minZoom),
      maxZoom: intOrUndef(form.maxZoom),
      osmRank: intOrUndef(form.osmRank),
      completenessLevel: form.completenessLevel || undefined,
      names,
      contacts: contacts.filter((c) => c.value.trim()),
      openingHours: hours,
      attributes: attributes
        .filter((a) => a.key.trim())
        .map((a) => ({ key: a.key, value: coerceAttributeValue(a.value, a.valueType), valueType: a.valueType })),
      images: images.filter((i) => i.url.trim()),
    };

    if (form.countryIso2.trim()) {
      payload.address = {
        countryIso2: form.countryIso2.trim().toUpperCase(),
        countryIso3: form.countryIso3.trim() || undefined,
        streetName: form.streetName.trim() ? { en: form.streetName.trim() } : undefined,
        streetNumber: form.streetNumber.trim() || undefined,
        blockNumber: form.blockNumber.trim() || undefined,
        buildingNumber: form.buildingNumber.trim() || undefined,
        buildingName: form.buildingName.trim() || undefined,
        unitNumber: form.unitNumber.trim() || undefined,
        floorNumber: form.floorNumber.trim() || undefined,
        postcode: form.postcode.trim() || undefined,
        postBox: form.postBox.trim() || undefined,
        formattedFull: form.formattedFull.trim() ? { en: form.formattedFull.trim() } : undefined,
        formattedShort: form.formattedShort.trim() ? { en: form.formattedShort.trim() } : undefined,
        landmarkDescription: form.landmarkDescription.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        woredaNumber: form.woredaNumber.trim() || undefined,
        kebeleNumber: form.kebeleNumber.trim() || undefined,
        isVerified: form.isVerified,
      };
    }

    const updated = await updatePlace(place.id, payload);
    setSaving(false);
    if (updated) {
      setPlace(updated);
      setBaseline(snapshotOf(form, names, contacts, hours, attributes, images, chainDraft));
      return true;
    }
    setToast("Save failed — check the backend is reachable.");
    return false;
  }

  async function handleSave() {
    const ok = await saveChanges();
    if (ok) {
      setToast("Changes saved.");
      void load();
    }
  }

  async function handleSaveChain() {
    if (!place?.address?.id) return;
    setSaving(true);
    const levels = chainDraft
      .filter((c) => c.name.trim())
      .map((c) => ({ level: c.level, name: { en: c.name.trim() } }));
    const result = await saveAdminLevelChain(place.address.id, levels);
    setSaving(false);
    if (result) {
      setChain(result);
      setToast("Admin-level chain saved.");
    } else {
      setToast("Save failed — chain must be continuous starting at level 0.");
    }
  }

  async function handleDecision(decision: "approve" | "reject") {
    if (!place) return;
    if (isDirty) {
      const saved = await saveChanges();
      if (!saved) return; // saveChanges already surfaced why via toast
    }
    setSaving(true);
    const result = await reviewPlace(place.id, decision);
    setSaving(false);
    if (result) {
      router.push(backHref);
    } else {
      setToast("Action failed — check the backend is reachable.");
    }
  }

  async function handleRefresh() {
    if (!place) return;
    setSaving(true);
    const result = await refreshPlace(place.id);
    setSaving(false);
    if (result) {
      setPlace(result);
      setToast("Marked as refreshed.");
    } else {
      setToast("Refresh failed — check the backend is reachable.");
    }
  }

  async function handleResolveFlag(flagId: string) {
    const ok = await resolveFlag(flagId, "dataforge-ui");
    if (ok) {
      setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, is_resolved: true } : f)));
      setToast("Flag resolved.");
    } else {
      setToast("Resolve failed — check the backend is reachable.");
    }
  }

  function addLanguage() {
    const code = newLangCode.trim().toLowerCase();
    if (!code || names[code] != null) return;
    setNames((prev) => ({ ...prev, [code]: "" }));
    setNewLangCode("");
  }

  function removeLanguage(lang: string) {
    setNames((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-[color:var(--text-muted)]">Loading…</div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-[13px] text-[color:var(--text-muted)]">
        <p>Place #{placeId} could not be loaded.</p>
        <Link href={backHref} className="text-[color:var(--orange-400)]">
          Back to {backLabel}
        </Link>
      </div>
    );
  }

  const primaryName = place.names.find((n) => n.isPrimary)?.name ?? place.names[0]?.name ?? `Place #${place.id}`;

  return (
    <div className="relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12">
      <div className="aurora-bg" aria-hidden />
      <ToastNotification message={toastMessage} visible={toastVisible} />

      <div className="relative z-10 flex flex-col gap-7">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[12px] text-[color:var(--text-muted)] transition hover:text-[color:var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {backLabel}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="font-display-tight text-[26px] font-semibold text-[color:var(--text-primary)]">{primaryName}</h2>
            <Badge variant="outline" className="border-[color:var(--border)] bg-[color:var(--surface-2)] font-mono text-[10px] text-[color:var(--text-muted)]">
              #{place.id}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px]",
                place.isVisible
                  ? "border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/12 text-[color:var(--text-success)]"
                  : "border-[color:var(--text-warning)]/25 bg-[color:var(--text-warning)]/12 text-[color:var(--text-warning)]",
              )}
            >
              {place.reviewStatus}
            </Badge>
          </div>
          {place.reviewReason ? (
            <p className="mt-2 max-w-2xl text-[12.5px] text-[color:var(--text-muted)]">{place.reviewReason}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[color:var(--text-muted)]">
            <span>Source:</span>
            {place.sourceChannelId ? (
              <Badge
                variant="outline"
                title={place.sourceChannel ?? undefined}
                className="border-[color:var(--border)] bg-[color:var(--surface-2)] text-[10.5px] text-[color:var(--text-secondary)]"
              >
                {place.sourceChannelName ?? place.sourceChannelId}
              </Badge>
            ) : (
              <span className="text-[color:var(--text-secondary)]">manual / unknown</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[12px] text-[color:var(--text-muted)]">
            <span>
              Last refreshed: <span className="text-[color:var(--text-secondary)]">{formatTimestamp(place.refreshedAt)}</span>
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Mark as refreshed
            </button>
          </div>
        </div>

        {place.aiValues ? (
          <GlassCard tone="accent">
            <CardHeader className="flex flex-row items-center gap-2 px-6 pb-0 pt-6">
              <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">AI Validation</CardTitle>
              {place.aiValues.aiDecision ? (
                <Badge
                  variant="outline"
                  className="ml-auto border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 text-[10px] text-[color:var(--orange-400)]"
                >
                  {place.aiValues.aiDecision}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-x-6 gap-y-2 px-6 pb-6 pt-5 text-[12px] text-[color:var(--text-secondary)]">
              <div>
                Trust:{" "}
                <span className="font-mono">
                  {place.aiValues.aiMlConfidence != null ? `${Math.round(place.aiValues.aiMlConfidence)}%` : "—"}
                </span>
              </div>
              <div>
                Geometry valid:{" "}
                <span className="font-mono">{place.aiValues.aiGeoValid == null ? "—" : String(place.aiValues.aiGeoValid)}</span>
              </div>
              <div>
                Name valid:{" "}
                <span className="font-mono">{place.aiValues.aiNameValid == null ? "—" : String(place.aiValues.aiNameValid)}</span>
              </div>
              <div>
                Language valid:{" "}
                <span className="font-mono">
                  {place.aiValues.aiLanguageValid == null ? "—" : String(place.aiValues.aiLanguageValid)}
                </span>
                {place.aiValues.aiLanguageValid === false ? (
                  <span className="ml-1 text-[color:var(--text-danger,#f87171)]">(out of allowed language)</span>
                ) : null}
              </div>
              <div>
                Duplicate score:{" "}
                <span className="font-mono">
                  {place.aiValues.aiDuplicateScore != null ? `${Math.round(place.aiValues.aiDuplicateScore)}%` : "—"}
                </span>
              </div>
            </CardContent>
          </GlassCard>
        ) : null}

        {flags.length > 0 ? (
          <Section title="Validation Flags" icon={ShieldAlert}>
            <div className="flex flex-col gap-2.5">
              {flags.map((f) => (
                <div
                  key={f.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5",
                    f.is_resolved
                      ? "border-[color:var(--border)] bg-[color:var(--surface-1)] opacity-60"
                      : "border-[color:var(--text-danger)]/20 bg-[color:var(--text-danger)]/[0.04]",
                  )}
                >
                  <div className="text-[11.5px]">
                    <span className="mr-2 font-mono text-[color:var(--text-muted)]">{f.category}</span>
                    <span className="text-[color:var(--text-primary)]">{f.message}</span>
                  </div>
                  {!f.is_resolved ? (
                    <button
                      type="button"
                      onClick={() => void handleResolveFlag(f.id)}
                      className="shrink-0 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 py-1 text-[10.5px] font-medium text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10.5px] text-[color:var(--text-muted)]">resolved</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Basic Info" icon={MapPin}>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Place type" value={form.placeType} onChange={(v) => set("placeType", v)} options={PLACE_TYPES} allowEmpty={false} />
              <SelectField label="Access type" value={form.accessType} onChange={(v) => set("accessType", v)} options={ACCESS_TYPES} />
            </div>
            <CategoryField
              categoryId={form.categoryId}
              categories={categories}
              onChange={(v) => set("categoryId", v)}
              onCategoryCreated={(c) => setCategories((prev) => [...prev, c])}
            />
            <CheckboxField label="Active (business is open)" checked={form.isActive} onChange={(v) => set("isActive", v)} />
          </Section>

          <Section title="Name" icon={MapPin} flagged={nameFlagged}>
            {Object.keys(names).length === 0 ? (
              <div className="text-[11.5px] text-[color:var(--text-muted)]">No names on record.</div>
            ) : (
              Object.entries(names).map(([lang, value]) => (
                <div key={lang} className="flex items-end gap-2">
                  <div className="flex-1">
                    <FieldLabel>{lang.toUpperCase()}</FieldLabel>
                    <input
                      className={inputClass}
                      value={value}
                      onChange={(e) => setNames((prev) => ({ ...prev, [lang]: e.target.value }))}
                    />
                  </div>
                  <RemoveButton onClick={() => removeLanguage(lang)} />
                </div>
              ))
            )}
            <div className="flex items-end gap-2">
              <input
                className={inputClass}
                value={newLangCode}
                onChange={(e) => setNewLangCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLanguage();
                  }
                }}
                placeholder="language code, e.g. am"
                maxLength={5}
              />
              <button
                type="button"
                onClick={addLanguage}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[11.5px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add language
              </button>
            </div>
          </Section>

          <Section title="Location" icon={MapPin} flagged={geoFlagged}>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Latitude" value={form.latitude} onChange={(v) => set("latitude", v)} type="number" />
              <TextField label="Longitude" value={form.longitude} onChange={(v) => set("longitude", v)} type="number" />
              <TextField label="Elevation (m)" value={form.elevationMeters} onChange={(v) => set("elevationMeters", v)} type="number" />
              <TextField label="Area (m²)" value={form.areaSqMeters} onChange={(v) => set("areaSqMeters", v)} type="number" />
              <TextField label="Building levels" value={form.buildingLevels} onChange={(v) => set("buildingLevels", v)} type="number" />
              <TextField label="Geocode confidence (0–1)" value={form.geocodeConfidence} onChange={(v) => set("geocodeConfidence", v)} type="number" />
            </div>
            <SelectField label="Geocode method" value={form.geocodeMethod} onChange={(v) => set("geocodeMethod", v)} options={GEOCODE_METHODS} />
            <div className="text-[10.5px] text-[color:var(--text-muted)]">Geometry type: {place.geometryType ?? "Point"} (editing polygon shapes is not supported here)</div>
          </Section>

          <Section title="Dates" icon={MapPin}>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Established at" value={form.establishedAt} onChange={(v) => set("establishedAt", v)} type="date" />
              <TextField label="Date closed" value={form.dateClosed} onChange={(v) => set("dateClosed", v)} type="date" />
            </div>
          </Section>

          <Section title="Address" icon={MapPin} flagged={hierarchyFlagged}>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Country (ISO2)" value={form.countryIso2} onChange={(v) => set("countryIso2", v)} placeholder="ET" />
              <TextField label="Country (ISO3)" value={form.countryIso3} onChange={(v) => set("countryIso3", v)} placeholder="ETH" />
            </div>
            <TextField label="Formatted address (full)" value={form.formattedFull} onChange={(v) => set("formattedFull", v)} placeholder="Street, City, Country" />
            <TextField label="Formatted address (short)" value={form.formattedShort} onChange={(v) => set("formattedShort", v)} placeholder="City, Country" />
            <TextField label="Street name" value={form.streetName} onChange={(v) => set("streetName", v)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Street number" value={form.streetNumber} onChange={(v) => set("streetNumber", v)} />
              <TextField label="Building number" value={form.buildingNumber} onChange={(v) => set("buildingNumber", v)} />
              <TextField label="Building name" value={form.buildingName} onChange={(v) => set("buildingName", v)} />
              <TextField label="Block number" value={form.blockNumber} onChange={(v) => set("blockNumber", v)} />
              <TextField label="Unit number" value={form.unitNumber} onChange={(v) => set("unitNumber", v)} />
              <TextField label="Floor number" value={form.floorNumber} onChange={(v) => set("floorNumber", v)} />
              <TextField label="Postcode" value={form.postcode} onChange={(v) => set("postcode", v)} />
              <TextField label="Post box" value={form.postBox} onChange={(v) => set("postBox", v)} />
              <TextField label="Woreda number" value={form.woredaNumber} onChange={(v) => set("woredaNumber", v)} />
              <TextField label="Kebele number" value={form.kebeleNumber} onChange={(v) => set("kebeleNumber", v)} />
            </div>
            <TextField label="Landmark description" value={form.landmarkDescription} onChange={(v) => set("landmarkDescription", v)} />
            <TextField label="Neighborhood" value={form.neighborhood} onChange={(v) => set("neighborhood", v)} placeholder="e.g. Bole, Kazanchis (free text — separate from the Admin-Level Chain below)" />
            <CheckboxField label="Address verified" checked={form.isVerified} onChange={(v) => set("isVerified", v)} />
          </Section>

          {place.address?.id ? (
            <Section title="Admin-Level Chain" icon={MapPin} flagged={hierarchyFlagged}>
              <div className="flex flex-col gap-2.5">
                {chainDraft.map((entry, i) => (
                  <div key={entry.level} className="flex items-center gap-2.5">
                    <span className="w-24 shrink-0 text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
                      {addressLevelName(
                        addressLevels.find((l) => l.level === entry.level),
                        entry.level,
                      )}
                    </span>
                    <input
                      className={inputClass}
                      value={entry.name}
                      placeholder={`e.g. ${addressLevelName(
                        addressLevels.find((l) => l.level === entry.level),
                        entry.level,
                      )}`}
                      onChange={(e) =>
                        setChainDraft((prev) => prev.map((c, idx) => (idx === i ? { ...c, name: e.target.value } : c)))
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleSaveChain()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[11.5px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                Save Chain
              </button>
              {chain.length === 0 ? (
                <div className="text-[10.5px] text-[color:var(--text-muted)]">
                  No chain stored yet — fill in Country/Region/Zone/City above and save (must be
                  continuous starting at level 0).
                </div>
              ) : null}
            </Section>
          ) : null}

          <Section title="Contacts" icon={MapPin}>
            {contacts.map((c, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="w-32 shrink-0">
                  <FieldLabel>Type</FieldLabel>
                  <select
                    className={selectClass}
                    value={c.type}
                    onChange={(e) =>
                      setContacts((prev) => prev.map((x, idx) => (idx === i ? { ...x, type: e.target.value } : x)))
                    }
                  >
                    {CONTACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <FieldLabel>Value</FieldLabel>
                  <input
                    className={inputClass}
                    value={c.value}
                    onChange={(e) =>
                      setContacts((prev) => prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="w-28 shrink-0">
                  <FieldLabel>Label</FieldLabel>
                  <input
                    className={inputClass}
                    value={c.label ?? ""}
                    onChange={(e) =>
                      setContacts((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                    }
                  />
                </div>
                <RemoveButton onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <AddButton
              label="Add contact"
              onClick={() => setContacts((prev) => [...prev, { type: CONTACT_TYPES[0], value: "", label: "" }])}
            />
          </Section>

          <Section title="Opening Hours" icon={MapPin}>
            {hours.map((h, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="w-28 shrink-0">
                  <FieldLabel>Day</FieldLabel>
                  <select
                    className={selectClass}
                    value={h.weekday}
                    onChange={(e) =>
                      setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, weekday: Number(e.target.value) } : x)))
                    }
                  >
                    {WEEKDAYS.map((day, idx) => (
                      <option key={day} value={idx}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24 shrink-0">
                  <FieldLabel>Opens</FieldLabel>
                  <input
                    className={inputClass}
                    type="time"
                    value={h.opensAt}
                    onChange={(e) =>
                      setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, opensAt: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="w-24 shrink-0">
                  <FieldLabel>Closes</FieldLabel>
                  <input
                    className={inputClass}
                    type="time"
                    value={h.closesAt}
                    onChange={(e) =>
                      setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, closesAt: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="flex-1">
                  <FieldLabel>Label</FieldLabel>
                  <input
                    className={inputClass}
                    value={h.label ?? ""}
                    onChange={(e) =>
                      setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="pb-2">
                  <CheckboxField
                    label="Closed"
                    checked={h.isClosed}
                    onChange={(v) => setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, isClosed: v } : x)))}
                  />
                </div>
                <RemoveButton onClick={() => setHours((prev) => prev.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <AddButton
              label="Add hours"
              onClick={() => setHours((prev) => [...prev, { weekday: 0, opensAt: "09:00", closesAt: "17:00", isClosed: false, label: "" }])}
            />
          </Section>

          <Section title="Attributes" icon={MapPin}>
            {attributes.map((a, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <FieldLabel>Key</FieldLabel>
                  <input
                    className={inputClass}
                    value={a.key}
                    onChange={(e) =>
                      setAttributes((prev) => prev.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="flex-1">
                  <FieldLabel>Value</FieldLabel>
                  <input
                    className={inputClass}
                    value={a.value}
                    onChange={(e) =>
                      setAttributes((prev) => prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="w-32 shrink-0">
                  <FieldLabel>Type</FieldLabel>
                  <select
                    className={selectClass}
                    value={a.valueType}
                    onChange={(e) =>
                      setAttributes((prev) => prev.map((x, idx) => (idx === i ? { ...x, valueType: e.target.value } : x)))
                    }
                  >
                    {ATTRIBUTE_VALUE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <RemoveButton onClick={() => setAttributes((prev) => prev.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <AddButton
              label="Add attribute"
              onClick={() => setAttributes((prev) => [...prev, { key: "", value: "", valueType: "STRING" }])}
            />
          </Section>

          <Section title="Images" icon={MapPin}>
            {images.map((img, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <FieldLabel>URL</FieldLabel>
                  <input
                    className={inputClass}
                    value={img.url}
                    onChange={(e) =>
                      setImages((prev) => prev.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="pb-2">
                  <CheckboxField
                    label="Primary"
                    checked={img.isPrimary}
                    onChange={(v) =>
                      setImages((prev) => prev.map((x, idx) => ({ ...x, isPrimary: idx === i ? v : v ? false : x.isPrimary })))
                    }
                  />
                </div>
                <RemoveButton onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <AddButton label="Add image" onClick={() => setImages((prev) => [...prev, { url: "", isPrimary: prev.length === 0 }])} />
          </Section>

          <Section title="Ranking &amp; Completeness" icon={MapPin}>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Place rank" value={form.placeRank} onChange={(v) => set("placeRank", v)} type="number" />
              <TextField label="Display rank" value={form.displayRank} onChange={(v) => set("displayRank", v)} type="number" />
              <TextField label="Min zoom" value={form.minZoom} onChange={(v) => set("minZoom", v)} type="number" />
              <TextField label="Max zoom" value={form.maxZoom} onChange={(v) => set("maxZoom", v)} type="number" />
              <TextField label="OSM rank" value={form.osmRank} onChange={(v) => set("osmRank", v)} type="number" />
            </div>
            <SelectField
              label="Completeness level"
              value={form.completenessLevel}
              onChange={(v) => set("completenessLevel", v)}
              options={COMPLETENESS_LEVELS}
              allowEmpty={false}
            />
            <div className="text-[10.5px] text-[color:var(--text-muted)]">
              Completeness score: {place.completenessScore.toFixed(1)} (computed server-side from completeness
              rules — not directly editable)
            </div>
          </Section>
        </div>

        <GlassCard>
          <CardContent className="flex flex-wrap items-center gap-2.5 px-6 py-5">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
            {isDirty ? (
              <span className="text-[11px] text-[color:var(--text-muted)]">
                Unsaved changes — will be saved automatically before Approve/Reject.
              </span>
            ) : null}

            {mode === "queue" ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleDecision("reject")}
                  disabled={saving}
                  className="ml-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-4 py-2 text-[12px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20 disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecision("approve")}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--text-success)]/30 bg-[color:var(--text-success)]/12 px-4 py-2 text-[12px] font-medium text-[color:var(--text-success)] transition hover:bg-[color:var(--text-success)]/20 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </button>
              </>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[color:var(--text-muted)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve individual flags above once the data is corrected.
              </span>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
