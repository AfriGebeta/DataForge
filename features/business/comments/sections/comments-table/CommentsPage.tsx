"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchPlace } from "@/features/verification/shared/api";
import { fetchComments } from "../../api";
import type { PlaceComment } from "../../types";
import ActionModals from "../action-modals";
import CommentsSection from "./CommentsSection";

const PAGE_SIZE = 20;

export default function CommentsPage() {
  const [comments, setComments] = useState<PlaceComment[]>([]);
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeIdFilter, setPlaceIdFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editComment, setEditComment] = useState<PlaceComment | null>(null);
  const [deleteComment, setDeleteComment] = useState<PlaceComment | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchComments({ limit: PAGE_SIZE, offset, placeId: placeIdFilter || undefined });
      setComments(res.data);
      setTotal(res.total);

      const uniquePlaceIds = Array.from(new Set(res.data.map((c) => c.placeId)));
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
      setError(cause instanceof Error ? cause.message : "Unable to load comments right now.");
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

      <CommentsSection
        comments={comments}
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
        onEdit={(comment) => setEditComment(comment)}
        onDelete={(comment) => setDeleteComment(comment)}
      />

      <ActionModals
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
        onCreated={() => { showToast("Comment added."); void load(); }}
        editComment={editComment}
        onEditClose={() => setEditComment(null)}
        onEdited={() => { showToast("Comment updated."); void load(); }}
        deleteComment={deleteComment}
        placeName={deleteComment ? placeNames[deleteComment.placeId] : undefined}
        onDeleteClose={() => setDeleteComment(null)}
        onDeleted={() => { showToast("Comment deleted."); void load(); }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
