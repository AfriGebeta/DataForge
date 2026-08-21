"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchPlaces } from "../../api";
import type { AIDecision, IngestChannelType, PlaceListItem, PlaceType as TPlaceType, ReviewStatus } from "../../types";
import { PLACE_TYPES } from "@/features/verification/shared/types";
import { fetchParentCategories, getLocalizedName } from "@/features/category/categories/api";
import type { Category } from "@/features/category/categories/types";
import { fetchSettings } from "@/features/system/settings/api";
import { fetchChannels } from "@/features/data/channels/api";
import type { ChannelConfig } from "@/features/data/channels/types";
import { GlassCard } from "@/features/shared/GlassCard";

const PAGE_SIZE = 10;

// Fallback while System → Settings' real staleDaysThreshold is loading —
// 2 months, matching that setting's own default on the backend.
const DEFAULT_STALE_DAYS = 60;

const REVIEW_TONE: Record<string, string> = {
  COMPLETED: "bx s",
  NEEDS_REVIEW: "bx w",
};

const TRI_STATE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;

// Friendlier labels than the raw IngestChannel enum for the "kind of
// channel" filter - the specific-instance filter (which of possibly
// several Telegram channels, say) is a second dropdown populated from
// GET /channels instead, since that set is dynamic/per-deployment.
const CHANNEL_TYPE_LABELS: Record<IngestChannelType, string> = {
  TELEGRAM_BOT: "Telegram (bot)",
  TELEGRAM_WEBHOOK: "Telegram (webhook)",
  WHATSAPP_WEBHOOK: "WhatsApp",
  REST_API: "REST API (your own service)",
  BATCH_IMPORT: "Batch import",
  MANUAL: "Manual entry",
};

export default function PlaceListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [filterType, setFilterType] = useState<TPlaceType | "">("");
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | "">("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [filterVisible, setFilterVisible] = useState<"" | "true" | "false">("");
  const [filterAiDecision, setFilterAiDecision] = useState<AIDecision | "">("");
  const [filterChannel, setFilterChannel] = useState<IngestChannelType | "">("");
  const [filterChannelId, setFilterChannelId] = useState("");
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  // Preset from `?stale=true` so the Overview Dashboard's "needing refresh"
  // KPI can deep-link straight into this filter.
  const [staleOnly, setStaleOnly] = useState(() => searchParams.get("stale") === "true");
  const [staleCount, setStaleCount] = useState<number | null>(null);
  const [staleDays, setStaleDays] = useState(DEFAULT_STALE_DAYS);
  // Preset from `?missingCategory=true` so the Overview Dashboard's
  // "unfinished places" KPI can deep-link straight into this filter.
  const [missingCategoryOnly, setMissingCategoryOnly] = useState(
    () => searchParams.get("missingCategory") === "true",
  );
  const [missingCategoryCount, setMissingCategoryCount] = useState<number | null>(null);
  // Preset from `?missingCoordinates=true` — same pattern, for places whose
  // coordinates were never really set ("Null Island" 0,0).
  const [missingCoordinatesOnly, setMissingCoordinatesOnly] = useState(
    () => searchParams.get("missingCoordinates") === "true",
  );
  const [missingCoordinatesCount, setMissingCoordinatesCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetchParentCategories().then(setCategories);
  }, []);

  useEffect(() => {
    void fetchChannels({ limit: 200 }).then((res) => setChannels(res.data));
  }, []);

  useEffect(() => {
    void fetchSettings()
      .then((s) => setStaleDays(s.staleDaysThreshold))
      .catch(() => setStaleDays(DEFAULT_STALE_DAYS));
  }, []);

  // Total count of outdated places, independent of the current filters —
  // fetches just 1 row and reads the pagination `total`, so it doesn't pull
  // the whole table down to count client-side.
  useEffect(() => {
    void fetchPlaces({ limit: 1, staleDays }).then((res) => setStaleCount(res.total));
  }, [staleDays]);

  // Total count of places with no category, independent of current filters —
  // same "fetch 1 row, read total" pattern as staleCount above.
  useEffect(() => {
    void fetchPlaces({ limit: 1, missingCategory: true }).then((res) => setMissingCategoryCount(res.total));
  }, []);

  // Total count of places with no real coordinates, independent of current
  // filters — same "fetch 1 row, read total" pattern as the two above.
  useEffect(() => {
    void fetchPlaces({ limit: 1, missingCoordinates: true }).then((res) => setMissingCoordinatesCount(res.total));
  }, []);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, getLocalizedName(c, "en")]));
    return (id?: string) => (id ? map.get(id) ?? id : "—");
  }, [categories]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus, filterCategoryId, filterActive, filterVisible, filterAiDecision, filterChannel, filterChannelId, staleOnly, missingCategoryOnly, missingCoordinatesOnly, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlaces({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        placeType: filterType || undefined,
        reviewStatus: filterStatus || undefined,
        categoryId: filterCategoryId || undefined,
        isActive: filterActive === "" ? undefined : filterActive === "true",
        isVisible: filterVisible === "" ? undefined : filterVisible === "true",
        aiDecision: filterAiDecision || undefined,
        channel: filterChannel || undefined,
        channelId: filterChannelId || undefined,
        staleDays: staleOnly ? staleDays : undefined,
        missingCategory: missingCategoryOnly ? true : undefined,
        missingCoordinates: missingCoordinatesOnly ? true : undefined,
        search: searchQuery || undefined,
      });
      setPlaces(res.data);
      setTotal(res.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load places.");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterCategoryId, filterActive, filterVisible, filterAiDecision, filterChannel, filterChannelId, staleOnly, staleDays, missingCategoryOnly, missingCoordinatesOnly, searchQuery, page]);

  useEffect(() => { void load(); }, [load]);

  const primaryName = (p: PlaceListItem) => {
    const primary = p.names.find((n) => n.isPrimary);
    return primary?.name ?? p.names[0]?.name ?? "Unnamed";
  };

  return (
    <div className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12" id="v-place-list">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6">
      <div className="page-hd" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h2>Place List</h2>
          <p>
            Browse all places from <span className="mono">GET /api/v1/places</span>. Click a row to open its detail page.
            <span style={{ marginLeft: 6, color: "var(--text-accent)" }}>{total} total</span>
          </p>
        </div>
        <button type="button" className="btn sm" onClick={() => void load()}>
          <i className="ti ti-refresh" />Refresh
        </button>
      </div>

      <GlassCard flat className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-clock-exclamation" style={{ color: "var(--text-warning)", fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {staleCount == null ? "…" : staleCount} outdated {staleCount === 1 ? "place" : "places"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Not refreshed in the last {staleDays} days — includes places never refreshed at all. Configurable in System → Settings.
            </div>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
          Show outdated only
        </label>
      </GlassCard>

      <GlassCard flat className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-category-2" style={{ color: "var(--text-danger)", fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {missingCategoryCount == null ? "…" : missingCategoryCount} unfinished {missingCategoryCount === 1 ? "place" : "places"} — no category
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              These places have never had a category assigned. Counts toward completeness scoring.
            </div>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <input type="checkbox" checked={missingCategoryOnly} onChange={(e) => setMissingCategoryOnly(e.target.checked)} />
          Show missing category only
        </label>
      </GlassCard>

      <GlassCard flat className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-map-pin-off" style={{ color: "var(--text-danger)", fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {missingCoordinatesCount == null ? "…" : missingCoordinatesCount} unfinished {missingCoordinatesCount === 1 ? "place" : "places"} — no coordinates
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              These places still have placeholder (0, 0) coordinates — never geocoded.
            </div>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <input type="checkbox" checked={missingCoordinatesOnly} onChange={(e) => setMissingCoordinatesOnly(e.target.checked)} />
          Show missing coordinates only
        </label>
      </GlassCard>

      {error ? <div className="category-inline-error">{error}</div> : null}

      <div style={{ position: "relative", maxWidth: 420 }}>
        <i
          className="ti ti-search"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            fontSize: 15,
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", paddingLeft: 34, paddingRight: searchQuery ? 34 : 10 }}
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 13 }} />
          </button>
        ) : null}
      </div>

      <div className="toolbar" style={{ flexWrap: "wrap" }}>
        <select className="glass-select" style={{ width: 150 }} value={filterType} onChange={(e) => setFilterType(e.target.value as TPlaceType | "")}>
          <option value="">All types</option>
          {PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="glass-select" style={{ width: 160 }} value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{getLocalizedName(c, "en")}</option>)}
        </select>
        <select className="glass-select" style={{ width: 150 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ReviewStatus | "")}>
          <option value="">All statuses</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
        </select>
        <select className="glass-select" style={{ width: 130 }} value={filterAiDecision} onChange={(e) => setFilterAiDecision(e.target.value as AIDecision | "")}>
          <option value="">Any AI decision</option>
          <option value="VALID">VALID</option>
          <option value="INVALID">INVALID</option>
          <option value="AMBIGUOUS">AMBIGUOUS</option>
          <option value="DUPLICATE">DUPLICATE</option>
        </select>
        <select
          className="glass-select"
          style={{ width: 180 }}
          value={filterChannel}
          onChange={(e) => {
            // A specific channel implies a channel kind - clear it rather
            // than leave a stale combination that can never match anything
            // (e.g. "REST API" + a Telegram channel's id).
            setFilterChannel(e.target.value as IngestChannelType | "");
            setFilterChannelId("");
          }}
        >
          <option value="">Any source</option>
          {(Object.entries(CHANNEL_TYPE_LABELS) as [IngestChannelType, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {channels.length > 0 ? (
          <select
            className="glass-select"
            style={{ width: 180 }}
            value={filterChannelId}
            onChange={(e) => setFilterChannelId(e.target.value)}
          >
            <option value="">Any specific channel</option>
            {channels
              .filter((c) => !filterChannel || c.channel === filterChannel)
              .map((c) => (
                <option key={c.id} value={c.channel_id}>
                  {c.channel_name ?? c.channel_id}
                </option>
              ))}
          </select>
        ) : null}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
          Active
          <select className="glass-select" style={{ width: 80 }} value={filterActive} onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}>
            {TRI_STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
          Visible
          <select className="glass-select" style={{ width: 80 }} value={filterVisible} onChange={(e) => setFilterVisible(e.target.value as "" | "true" | "false")}>
            {TRI_STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <GlassCard flat className="card">
        {loading ? (
          <div className="category-empty category-empty-compact">Loading places…</div>
        ) : places.length === 0 ? (
          <div className="category-empty category-empty-compact">No places found.</div>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Source</th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Active</th>
                <th>Created</th>
                <th>Refreshed</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => (
                <tr
                  key={place.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/place/list/${place.id}`)}
                >
                  <td className="mono">{place.id}</td>
                  <td style={{ fontWeight: 500 }}>
                    {primaryName(place)}
                    {place.names.length > 1 && (
                      <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>
                        +{place.names.length - 1} names
                      </span>
                    )}
                  </td>
                  <td><span className="tag">{place.placeType}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{categoryName(place.categoryId)}</td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }} title={place.sourceChannel}>
                    {place.sourceChannelName ?? place.sourceChannelId ?? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</td>
                  <td><span className={REVIEW_TONE[place.reviewStatus] ?? "bx"}>{place.reviewStatus}</span></td>
                  <td><span className={place.isActive ? "bx s" : "bx d"}>{place.isActive ? "Yes" : "No"}</span></td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {place.createdAt ? new Date(place.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {place.refreshedAt ? new Date(place.refreshedAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 0 && !loading && (
          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-6 py-4">
            <div className="text-[11px] text-[color:var(--text-muted)]">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} places
            </div>
            <div className="flex gap-2">
              <button className="btn sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <i className="ti ti-chevron-left" /> Prev
              </button>
              <button className="btn sm" disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>
                Next <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
      </div>
    </div>
  );
}
