"use client";

import { useCallback, useState } from "react";
import { fetchPlace, updatePlace } from "@/features/verification/shared/api";
import type { PlaceDetail } from "@/features/verification/shared/types";
import { GlassCard } from "@/features/shared/GlassCard";

// PlaceForge has no DELETE endpoint for Place — the only supported removal
// path is soft-deactivation (isActive=false, isVisible=false) via
// PUT /places/{id}. This page keeps the original "type to confirm" friction
// for a destructive-feeling action, but performs a reversible deactivation.
export default function PlaceDeletePage() {
  const [placeId, setPlaceId] = useState("");
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    const id = parseInt(placeId, 10);
    if (isNaN(id)) { setError("Enter a valid numeric Place ID."); return; }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setConfirmText("");
    setPlace(null);

    const p = await fetchPlace(id);
    if (!p) setError("Place not found.");
    setPlace(p);
    setLoading(false);
  }, [placeId]);

  const handleDeactivate = useCallback(async () => {
    if (!place) return;
    setWorking(true);
    setError(null);

    const updated = await updatePlace(place.id, { isActive: false, isVisible: false });
    if (!updated) {
      setError("Failed to deactivate place.");
    } else {
      setPlace(updated);
      setFeedback(`Place #${place.id} "${primaryNameOf(place)}" has been deactivated (hidden and marked inactive).`);
      setConfirmText("");
    }
    setWorking(false);
  }, [place]);

  const handleReactivate = useCallback(async () => {
    if (!place) return;
    setWorking(true);
    setError(null);

    const updated = await updatePlace(place.id, { isActive: true, isVisible: true });
    if (!updated) {
      setError("Failed to reactivate place.");
    } else {
      setPlace(updated);
      setFeedback(`Place #${place.id} "${primaryNameOf(place)}" has been reactivated.`);
    }
    setWorking(false);
  }, [place]);

  function primaryNameOf(p: PlaceDetail): string {
    return p.names.find((n) => n.isPrimary)?.name ?? p.names[0]?.name ?? "Unnamed";
  }

  return (
    <div className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12" id="v-place-delete">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6">
      <div className="page-hd">
        <h2>Deactivate Place</h2>
        <p>
          PlaceForge has no hard-delete endpoint for places — removal means deactivating via{" "}
          <span className="mono">PUT /api/v1/places/&#123;id&#125;</span> (isActive/isVisible off), which can be undone.
        </p>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      {/* Fetch section */}
      <GlassCard flat className="card" style={{ marginBottom: 14 }}>
        <div className="ch"><span className="ct">Look Up Place</span></div>
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

      {/* Place preview + deactivate/reactivate */}
      {place && (
        <GlassCard flat className="card">
          <div className="ch">
            <span className="ct">{place.isActive ? "Confirm Deactivation" : "Place is Inactive"}</span>
            <span className={place.isActive ? "bx d" : "bx m"}>{place.isActive ? "DESTRUCTIVE" : "DEACTIVATED"}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Place</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{primaryNameOf(place)}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>ID: {place.id} · v{place.version ?? 1}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Details</div>
              <div><span className="tag">{place.placeType}</span> <span className={place.reviewStatus === "COMPLETED" ? "bx s" : "bx w"}>{place.reviewStatus}</span></div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</div>
              <div style={{ marginTop: 4 }}>
                <span className={place.isActive ? "bx s" : "bx d"}>{place.isActive ? "Active" : "Inactive"}</span>{" "}
                <span className={place.isVisible ? "bx s" : "bx d"}>{place.isVisible ? "Visible" : "Hidden"}</span>
              </div>
            </div>
          </div>

          {(place.contacts?.length ?? 0) > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Contacts</div>
              {place.contacts!.map((c, i) => (
                <div key={i} className="mono" style={{ fontSize: 11 }}>{c.type}: {c.value}</div>
              ))}
            </div>
          )}

          {place.address && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Address</div>
              <div style={{ fontSize: 12 }}>{place.address.streetName?.en ?? ""} {place.address.streetNumber ?? ""}, {place.address.countryIso2}</div>
            </div>
          )}

          <div className="sep" />

          {place.isActive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
              <div style={{ fontSize: 12, color: "var(--text-danger)" }}>
                <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />
                This hides the place from all public listings and marks it inactive. It can be reversed here later. Type <strong>DEACTIVATE</strong> to confirm.
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Type DEACTIVATE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  style={{ flex: 1, borderColor: confirmText === "DEACTIVATE" ? "var(--text-danger)" : "" }}
                />
                <button
                  type="button"
                  className="btn d"
                  onClick={() => void handleDeactivate()}
                  disabled={working || confirmText !== "DEACTIVATE"}
                >
                  <i className="ti ti-eye-off" />
                  {working ? "Deactivating…" : "Deactivate Place"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0" }}>
              <button type="button" className="btn p" onClick={() => void handleReactivate()} disabled={working}>
                <i className="ti ti-eye" />
                {working ? "Reactivating…" : "Reactivate Place"}
              </button>
            </div>
          )}
        </GlassCard>
      )}
      </div>
    </div>
  );
}
