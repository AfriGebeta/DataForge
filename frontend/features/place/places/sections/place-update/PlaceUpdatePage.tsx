"use client";

import { useCallback, useState } from "react";
import { fetchPlace, updatePlace } from "../../api";
import type { Place, UpdatePlaceRequest, ReviewStatus, PlaceType } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

export default function PlaceUpdatePage() {
  const [placeId, setPlaceId] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [placeType, setPlaceType] = useState<PlaceType>("POI");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("PENDING");
  const [reviewReason, setReviewReason] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [bboxMinLat, setBboxMinLat] = useState("");
  const [bboxMinLng, setBboxMinLng] = useState("");
  const [bboxMaxLat, setBboxMaxLat] = useState("");
  const [bboxMaxLng, setBboxMaxLng] = useState("");
  const [areaCoordinatesStr, setAreaCoordinatesStr] = useState("");

  const handleFetch = useCallback(async () => {
    const id = parseInt(placeId);
    if (isNaN(id)) { setError("Enter a valid numeric Place ID."); return; }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setPlace(null);

    try {
      const p = await fetchPlace(id);
      setPlace(p);
      setPlaceType(p.placeType);
      setLatitude(String(p.latitude));
      setLongitude(String(p.longitude));
      setIsActive(p.isActive);
      setIsVisible(p.isVisible);
      setReviewStatus(p.reviewStatus);
      setReviewReason(p.reviewReason ?? "");
      const primary = p.names.find((n) => n.isPrimary);
      setPrimaryName(primary?.name ?? p.names[0]?.name ?? "");
      setBboxMinLat(p.bboxMinLat !== undefined ? String(p.bboxMinLat) : "");
      setBboxMinLng(p.bboxMinLng !== undefined ? String(p.bboxMinLng) : "");
      setBboxMaxLat(p.bboxMaxLat !== undefined ? String(p.bboxMaxLat) : "");
      setBboxMaxLng(p.bboxMaxLng !== undefined ? String(p.bboxMaxLng) : "");
      setAreaCoordinatesStr(p.areaCoordinates ? JSON.stringify(p.areaCoordinates) : "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to fetch place.");
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    const request: UpdatePlaceRequest = {};

    if (placeType !== place.placeType) request.placeType = placeType;
    if (latitude !== String(place.latitude)) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) { setError("Latitude must be between -90 and 90."); setSubmitting(false); return; }
      request.latitude = lat;
    }
    if (longitude !== String(place.longitude)) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) { setError("Longitude must be between -180 and 180."); setSubmitting(false); return; }
      request.longitude = lng;
    }
    if (isActive !== place.isActive) request.isActive = isActive;
    if (isVisible !== place.isVisible) request.isVisible = isVisible;
    if (reviewStatus !== place.reviewStatus) request.reviewStatus = reviewStatus;
    if (reviewReason !== (place.reviewReason ?? "")) request.reviewReason = reviewReason;

    const originalPrimary = place.names.find((n) => n.isPrimary);
    if (primaryName !== (originalPrimary?.name ?? "")) {
      request.names = place.names.map((n) =>
        n.isPrimary ? { ...n, name: primaryName } : n,
      );
    }
    
    if (bboxMinLat && bboxMinLat !== String(place.bboxMinLat ?? "")) request.bboxMinLat = parseFloat(bboxMinLat);
    if (bboxMinLng && bboxMinLng !== String(place.bboxMinLng ?? "")) request.bboxMinLng = parseFloat(bboxMinLng);
    if (bboxMaxLat && bboxMaxLat !== String(place.bboxMaxLat ?? "")) request.bboxMaxLat = parseFloat(bboxMaxLat);
    if (bboxMaxLng && bboxMaxLng !== String(place.bboxMaxLng ?? "")) request.bboxMaxLng = parseFloat(bboxMaxLng);
    if (areaCoordinatesStr !== (place.areaCoordinates ? JSON.stringify(place.areaCoordinates) : "")) {
      if (!areaCoordinatesStr.trim()) {
        request.areaCoordinates = undefined;
      } else {
        try {
          const parsed = JSON.parse(areaCoordinatesStr);
          if (Array.isArray(parsed)) request.areaCoordinates = parsed;
        } catch {
          setError("Invalid JSON in Area Coordinates.");
          setSubmitting(false);
          return;
        }
      }
    }

    if (Object.keys(request).length === 0) {
      setFeedback("No changes detected.");
      setSubmitting(false);
      return;
    }

    try {
      await updatePlace(place.id, request);
      setFeedback(`Place #${place.id} updated successfully.`);
      // Re-fetch to show updated data
      const updated = await fetchPlace(place.id);
      setPlace(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update place.");
    } finally {
      setSubmitting(false);
    }
  }, [place, placeType, latitude, longitude, isActive, isVisible, reviewStatus, reviewReason, primaryName]);

  return (
    <div className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12" id="v-place-update">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6">
      <div className="page-hd">
        <h2>Update Place</h2>
        <p>Partial update via <span className="mono">PUT /api/v1/places/&#123;id&#125;</span>. Only changed fields are sent.</p>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      {/* Fetch section */}
      <GlassCard flat className="card" style={{ marginBottom: 14 }}>
        <div className="ch"><span className="ct">Fetch Place by ID</span></div>
        <div className="fr" style={{ alignItems: "flex-end" }}>
          <div className="fg">
            <label className="fl">Place ID <span>*</span></label>
            <input type="text" placeholder="1" value={placeId} onChange={(e) => setPlaceId(e.target.value)} />
          </div>
          <div className="fg" style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="button" className="btn p" onClick={() => void handleFetch()} disabled={loading} style={{ width: "100%" }}>
              <i className="ti ti-search" />{loading ? "Loading…" : "Fetch Place"}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Current data display */}
      {place && (
        <>
          <GlassCard flat className="card" style={{ marginBottom: 14 }}>
            <div className="ch"><span className="ct">Current Place Data</span><span className="chip hi">ID: {place.id}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12, padding: "0 0 8px" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Name</div>
                <div>{place.names.find((n) => n.isPrimary)?.name ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Type / Status</div>
                <div><span className="tag">{place.placeType}</span> <span className="bx m">{place.reviewStatus}</span></div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Coordinates</div>
                <div className="mono" style={{ fontSize: 11 }}>{place.latitude}, {place.longitude}</div>
              </div>
            </div>
          </GlassCard>

          {/* Edit form */}
          <form onSubmit={handleSubmit}>
            <GlassCard flat className="card" style={{ marginBottom: 14 }}>
              <div className="ch"><span className="ct">Edit Fields</span><span style={{ fontSize: 10, color: "var(--text-muted)" }}>Only changed fields will be sent</span></div>
              <div className="fg">
                <label className="fl">Primary Name</label>
                <input type="text" value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} />
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Place Type</label>
                  <select className="glass-select" value={placeType} onChange={(e) => setPlaceType(e.target.value as PlaceType)}>
                    {["POI","CAFE","RESTAURANT","HOTEL","SHOP","BANK","HOSPITAL","SCHOOL","GOVERNMENT","WORSHIP","TRANSPORT","PARK","OTHER"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Review Status</label>
                  <select className="glass-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}>
                    <option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="FLAGGED">FLAGGED</option><option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Latitude</label>
                  <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">Longitude</label>
                  <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                </div>
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">BBox Min Lat</label>
                  <input type="number" step="any" value={bboxMinLat} onChange={(e) => setBboxMinLat(e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">BBox Min Lng</label>
                  <input type="number" step="any" value={bboxMinLng} onChange={(e) => setBboxMinLng(e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">BBox Max Lat</label>
                  <input type="number" step="any" value={bboxMaxLat} onChange={(e) => setBboxMaxLat(e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">BBox Max Lng</label>
                  <input type="number" step="any" value={bboxMaxLng} onChange={(e) => setBboxMaxLng(e.target.value)} />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Area Coordinates (JSON)</label>
                <input type="text" placeholder="[[9.0, 38.0]]" value={areaCoordinatesStr} onChange={(e) => setAreaCoordinatesStr(e.target.value)} />
              </div>
              <div className="fg">
                <label className="fl">Review Reason</label>
                <input type="text" placeholder="Reason for status change" value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} />
              </div>
              <div className="fr">
                <div className="fg" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
                </div>
                <div className="fg" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label><input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} /> Visible</label>
                </div>
              </div>
            </GlassCard>

            <div className="category-form-actions">
              <button type="submit" className="btn p" disabled={submitting}>
                <i className="ti ti-device-floppy" />
                {submitting ? "Updating…" : "Update Place"}
              </button>
            </div>
          </form>
        </>
      )}
      </div>
    </div>
  );
}
