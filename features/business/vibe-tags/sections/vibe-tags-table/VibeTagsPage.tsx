"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchPlace } from "@/features/verification/shared/api";
import { fetchVibeTags } from "../../api";
import type { VibeTag } from "../../types";
import ActionModals from "../action-modals";
import VibeTagsSection from "./VibeTagsSection";

const PAGE_SIZE = 20;

export default function VibeTagsPage() {
  const [tags, setTags] = useState<VibeTag[]>([]);
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeIdFilter, setPlaceIdFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<VibeTag | null>(null);
  const [deleteTag, setDeleteTag] = useState<VibeTag | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVibeTags({ limit: PAGE_SIZE, offset, placeId: placeIdFilter || undefined });
      setTags(res.data);
      setTotal(res.total);

      const uniquePlaceIds = Array.from(new Set(res.data.map((t) => t.placeId)));
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
      setError(cause instanceof Error ? cause.message : "Unable to load vibe tags right now.");
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

      <VibeTagsSection
        tags={tags}
        placeNames={placeNames}
        total={total}
        offset={offset}
        limit={PAGE_SIZE}
        loading={loading}
        placeIdFilter={placeIdFilter}
        onPlaceIdFilter={(value) => { setPlaceIdFilter(value); setOffset(0); }}
        onOffsetChange={setOffset}
        onRefresh={load}
        onCreate={() => setCreateOpen(true)}
        onEdit={(tag) => setEditTag(tag)}
        onDelete={(tag) => setDeleteTag(tag)}
      />

      <ActionModals
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
        onCreated={() => { showToast("Vibe tag added."); void load(); }}
        editTag={editTag}
        onEditClose={() => setEditTag(null)}
        onEdited={() => { showToast("Vibe tag updated."); void load(); }}
        deleteTag={deleteTag}
        placeName={deleteTag ? placeNames[deleteTag.placeId] : undefined}
        onDeleteClose={() => setDeleteTag(null)}
        onDeleted={() => { showToast("Vibe tag deleted."); void load(); }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
