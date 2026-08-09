"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchPlace } from "@/features/verification/shared/api";
import { fetchRatings } from "../../api";
import type { Rating } from "../../types";
import ActionModals from "../action-modals";
import RatingsSection from "./RatingsSection";

const PAGE_SIZE = 20;

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeIdFilter, setPlaceIdFilter] = useState("");
  const [deleteRating, setDeleteRating] = useState<Rating | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRatings({ limit: PAGE_SIZE, offset, placeId: placeIdFilter || undefined });
      setRatings(res.data);
      setTotal(res.total);

      const uniquePlaceIds = Array.from(new Set(res.data.map((r) => r.placeId)));
      const missing = uniquePlaceIds.filter((id) => !(id in placeNames));
      if (missing.length > 0) {
        const entries = await Promise.all(
          missing.map(async (id) => {
            const place = await fetchPlace(Number(id));
            const primary = place?.names.find((n) => n.isPrimary) ?? place?.names[0];
            return [id, primary?.name ?? null] as const;
          }),
        );
        setPlaceNames((prev) => {
          const next = { ...prev };
          for (const [id, name] of entries) if (name) next[id] = name;
          return next;
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load ratings right now.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, placeIdFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      <RatingsSection
        ratings={ratings}
        placeNames={placeNames}
        total={total}
        offset={offset}
        limit={PAGE_SIZE}
        loading={loading}
        placeIdFilter={placeIdFilter}
        onPlaceIdFilter={(value) => { setPlaceIdFilter(value); setOffset(0); }}
        onOffsetChange={setOffset}
        onRefresh={load}
        onDelete={(rating) => setDeleteRating(rating)}
      />

      <ActionModals
        deleteRating={deleteRating}
        placeName={deleteRating ? placeNames[deleteRating.placeId] : undefined}
        onDeleteClose={() => setDeleteRating(null)}
        onDeleted={() => { showToast("Rating deleted."); void load(); }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
