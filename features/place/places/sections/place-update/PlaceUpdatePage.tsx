"use client";

import { useCallback, useState } from "react";
import PlaceDetailPage from "@/features/verification/shared/PlaceDetailPage";
import { GlassCard } from "@/features/shared/GlassCard";

export default function PlaceUpdatePage() {
  const [placeIdInput, setPlaceIdInput] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    const id = parseInt(placeIdInput, 10);
    if (isNaN(id)) { setError("Enter a valid numeric Place ID."); return; }
    setError(null);
    setActiveId(id);
  }, [placeIdInput]);

  // Once a place is opened, the full editor (same one used from the
  // Verification menu) takes over the whole page — it fetches, edits, and
  // saves via PUT /api/v1/places/{id} on its own.
  if (activeId !== null) {
    return (
      <PlaceDetailPage
        placeId={activeId}
        mode="manage"
        backHref="/place/update"
        backLabel="Update Place"
      />
    );
  }

  return (
    <div className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12" id="v-place-update">
      <div className="aurora-bg" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="page-hd">
          <h2>Update Place</h2>
          <p>Look up a place by ID to open the full editor (<span className="mono">PUT /api/v1/places/&#123;id&#125;</span>). Only changed fields are sent.</p>
        </div>

        {error ? <div className="category-inline-error">{error}</div> : null}

        <GlassCard flat className="card">
          <div className="ch"><span className="ct">Find Place</span></div>
          <div className="fr" style={{ alignItems: "flex-end" }}>
            <div className="fg">
              <label className="fl">Place ID <span>*</span></label>
              <input
                type="text"
                placeholder="1"
                value={placeIdInput}
                onChange={(e) => setPlaceIdInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleOpen(); }}
              />
            </div>
            <div className="fg" style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="button" className="btn p" onClick={handleOpen} style={{ width: "100%" }}>
                <i className="ti ti-edit" />Open Editor
              </button>
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
            Not sure of the ID? Find it from <a href="/place/list" style={{ color: "var(--text-accent)" }}>Place List</a> first.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
