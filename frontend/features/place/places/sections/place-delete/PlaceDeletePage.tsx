"use client";

import { useCallback, useState } from "react";
import { fetchPlace, deletePlace } from "../../api";
import type { Place } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

export default function PlaceDeletePage() {
  const [placeId, setPlaceId] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    const id = parseInt(placeId);
    if (isNaN(id)) { setError("Enter a valid numeric Place ID."); return; }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setConfirmText("");
    setPlace(null);

    try {
      const p = await fetchPlace(id);
      setPlace(p);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to fetch place.");
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  const handleDelete = useCallback(async () => {
    if (!place) return;
    setDeleting(true);
    setError(null);

    try {
      await deletePlace(place.id);
      setFeedback(`Place #${place.id} "${place.names.find((n) => n.isPrimary)?.name ?? ""}" has been deleted.`);
      setPlace(null);
      setPlaceId("");
      setConfirmText("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete place.");
    } finally {
      setDeleting(false);
    }
  }, [place]);

  const primaryName = place?.names.find((n) => n.isPrimary)?.name ?? place?.names[0]?.name ?? "Unnamed";

  return (
    <div className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12" id="v-place-delete">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6">
      <div className="page-hd">
        <h2>Delete Place</h2>
        <p>Remove a place via <span className="mono">DELETE /api/v1/places/&#123;id&#125;</span>.</p>
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

      {/* Place preview + delete */}
      {place && (
        <GlassCard flat className="card">
          <div className="ch">
            <span className="ct">Confirm Deletion</span>
            <span className="bx d">DESTRUCTIVE</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Place</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{primaryName}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>ID: {place.id} · v{place.version ?? 1}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Details</div>
              <div><span className="tag">{place.placeType}</span> <span className={place.reviewStatus === "APPROVED" ? "bx s" : "bx m"}>{place.reviewStatus}</span></div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</div>
            </div>
          </div>

          {place.contacts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>Contacts</div>
              {place.contacts.map((c, i) => (
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

          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
            <div style={{ fontSize: 12, color: "var(--text-danger)" }}>
              <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />
              This action is permanent and cannot be undone. Please type <strong>DELETE</strong> to confirm.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <input 
                type="text" 
                placeholder="Type DELETE" 
                value={confirmText} 
                onChange={(e) => setConfirmText(e.target.value)}
                style={{ flex: 1, borderColor: confirmText === "DELETE" ? "var(--text-danger)" : "" }}
              />
              <button 
                type="button" 
                className="btn d" 
                onClick={() => void handleDelete()} 
                disabled={deleting || confirmText !== "DELETE"}
              >
                <i className="ti ti-trash" />
                {deleting ? "Deleting…" : "Delete Place"}
              </button>
            </div>
          </div>
        </GlassCard>
      )}
      </div>
    </div>
  );
}
