"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchPlace } from "@/features/verification/shared/api";
import { fetchPlaceSources } from "../../api";
import type { PlaceSource, PlaceSourcesPagination } from "../../types";
import ActionModals from "../action-modals";
import PlaceSourcesSection from "./PlaceSourcesSection";

export default function PlaceSourcesPage() {
  const [sources, setSources] = useState<PlaceSource[]>([]);
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState<PlaceSourcesPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeIdFilter, setPlaceIdFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editSource, setEditSource] = useState<PlaceSource | null>(null);
  const [deleteSource, setDeleteSource] = useState<PlaceSource | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlaceSources({ page, limit: 20, placeId: placeIdFilter || undefined });
      setSources(res.data);
      setPagination(res.pagination);

      const uniquePlaceIds = Array.from(new Set(res.data.map((s) => s.placeId)));
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
      setError(cause instanceof Error ? cause.message : "Unable to load place sources right now.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, placeIdFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      <PlaceSourcesSection
        sources={sources}
        placeNames={placeNames}
        pagination={pagination}
        loading={loading}
        placeIdFilter={placeIdFilter}
        onPlaceIdFilter={(value) => { setPlaceIdFilter(value); setPage(1); }}
        onPageChange={setPage}
        onRefresh={load}
        onCreate={() => setCreateOpen(true)}
        onEdit={(source) => setEditSource(source)}
        onDelete={(source) => setDeleteSource(source)}
      />

      <ActionModals
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
        onCreated={() => { showToast("Place source added."); void load(); }}
        editSource={editSource}
        onEditClose={() => setEditSource(null)}
        onEdited={() => { showToast("Place source updated."); void load(); }}
        deleteSource={deleteSource}
        placeName={deleteSource ? placeNames[deleteSource.placeId] : undefined}
        onDeleteClose={() => setDeleteSource(null)}
        onDeleted={() => { showToast("Place source deleted."); void load(); }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
