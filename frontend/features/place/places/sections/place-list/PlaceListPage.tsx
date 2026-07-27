"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPlaces } from "../../api";
import type { Place, PlaceListParams, ReviewStatus, PlaceType as TPlaceType } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

const REVIEW_TONE: Record<string, string> = {
  APPROVED: "bx s",
  PENDING: "bx m",
  FLAGGED: "bx w",
  REJECTED: "bx d",
};

export default function PlaceListPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TPlaceType | "">("");
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: PlaceListParams = { page, pageSize: 5 };
      if (filterType) params.placeType = filterType as TPlaceType;
      if (filterStatus) params.reviewStatus = filterStatus as ReviewStatus;
      if (searchQuery) params.search = searchQuery;
      const res = await fetchPlaces(params);
      setPlaces(res.data);
      setTotal(res.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load places.");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchQuery, page]);

  useEffect(() => { void load(); }, [load]);



  const primaryName = (p: Place) => {
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
            Browse all places from <span className="mono">GET /api/v1/places</span>.
            <span style={{ marginLeft: 6, color: "var(--text-accent)" }}>{total} total</span>
          </p>
        </div>
        <button type="button" className="btn sm" onClick={() => void load()}>
          <i className="ti ti-refresh" />Refresh
        </button>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 200 }}
        />
        <select className="glass-select" style={{ width: 120 }} value={filterType} onChange={(e) => setFilterType(e.target.value as TPlaceType | "")}>
          <option value="">All types</option>
          <option value="POI">POI</option>
          <option value="CAFE">CAFE</option>
          <option value="RESTAURANT">RESTAURANT</option>
          <option value="HOTEL">HOTEL</option>
          <option value="SHOP">SHOP</option>
          <option value="BANK">BANK</option>
          <option value="HOSPITAL">HOSPITAL</option>
          <option value="SCHOOL">SCHOOL</option>
          <option value="OTHER">OTHER</option>
        </select>
        <select className="glass-select" style={{ width: 120 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ReviewStatus | "")}>
          <option value="">All statuses</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
          <option value="FLAGGED">FLAGGED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <GlassCard flat className="card">
        {loading ? (
          <div className="category-empty category-empty-compact">Loading places…</div>
        ) : places.length === 0 ? (
          <div className="category-empty category-empty-compact">No places found.</div>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Active</th>
                <th>Created</th>

              </tr>
            </thead>
            <tbody>
              {places.map((place) => (
                <>
                  <tr key={place.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === place.id ? null : place.id)}>
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
                    <td className="mono" style={{ fontSize: 11 }}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</td>
                    <td><span className={REVIEW_TONE[place.reviewStatus] ?? "bx"}>{place.reviewStatus}</span></td>
                    <td><span className={place.isActive ? "bx s" : "bx d"}>{place.isActive ? "Yes" : "No"}</span></td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {place.createdAt ? new Date(place.createdAt).toLocaleDateString() : "—"}
                    </td>

                  </tr>
                  {expandedId === place.id && (
                    <tr key={`${place.id}-detail`}>
                      <td colSpan={7} style={{ padding: "12px 16px", background: "var(--surface-1)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>Address</div>
                            {place.address ? (
                              <div>
                                <div>{place.address.streetName?.en ?? "—"} {place.address.streetNumber ?? ""}</div>
                                <div style={{ color: "var(--text-muted)" }}>{place.address.countryIso2}</div>
                              </div>
                            ) : <span style={{ color: "var(--text-muted)" }}>No address</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>Contacts</div>
                            {place.contacts.length > 0 ? place.contacts.map((c, i) => (
                              <div key={i} className="mono" style={{ fontSize: 11 }}>{c.type}: {c.value} {c.label ? `(${c.label})` : ""}</div>
                            )) : <span style={{ color: "var(--text-muted)" }}>None</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>AI Values</div>
                            {place.aiValues ? (
                              <div>
                                <div>Decision: <span className={place.aiValues.aiDecision === "VALID" ? "bx s" : "bx w"}>{place.aiValues.aiDecision ?? "—"}</span></div>
                                <div className="mono" style={{ fontSize: 11 }}>Geo Score: {place.aiValues.aiGeoScore ?? "—"}</div>
                              </div>
                            ) : <span style={{ color: "var(--text-muted)" }}>No AI data</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>Geometry & Details</div>
                            <div className="mono" style={{ fontSize: 11 }}>
                              {place.geometryType}
                              {place.bboxMinLat ? ` • BBox [${place.bboxMinLat.toFixed(3)}, ${place.bboxMinLng?.toFixed(3)}]` : ""}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                              {place.areaSqMeters ? `Area: ${place.areaSqMeters} m²` : ""}
                              {place.elevationMeters ? ` • Elev: ${place.elevationMeters}m` : ""}
                              {place.buildingLevels ? ` • Levels: ${place.buildingLevels}` : ""}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                              {place.establishedAt ? `Est: ${new Date(place.establishedAt).toLocaleDateString()}` : ""}
                            </div>
                          </div>
                        </div>
                        {place.attributes.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>Attributes</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {place.attributes.map((a, i) => (
                                <span key={i} className="tag">{a.key}: {String(a.value)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {place.reviewReason && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary)" }}>
                            <strong>Review reason:</strong> {place.reviewReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
        {total > 0 && !loading && (
          <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
            <div className="text-[11px] text-white/50">
              Showing {(page - 1) * 5 + 1} to {Math.min(page * 5, total)} of {total} places
            </div>
            <div className="flex gap-2">
              <button className="btn sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="ti ti-chevron-left" /> Prev
              </button>
              <button className="btn sm" disabled={page * 5 >= total} onClick={() => setPage(p => p + 1)}>
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
