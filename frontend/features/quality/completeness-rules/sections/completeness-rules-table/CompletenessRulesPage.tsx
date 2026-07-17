"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import {
  deleteCompletenessRule,
  fetchCompletenessRules,
} from "../../api";
import type {
  CompletenessLevel,
  CompletenessRule,
  PlaceType,
} from "../../types";
import { CreateRuleModal } from "./components";
import CompletenessRulesSection from "./CompletenessRulesSection";

export default function CompletenessRulesPage() {
  const [rules, setRules] = useState<CompletenessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeTypeFilter, setPlaceTypeFilter] = useState<PlaceType | "">("");
  const [levelFilter, setLevelFilter] = useState<CompletenessLevel | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCompletenessRules({
        place_type: placeTypeFilter || undefined,
        level: levelFilter || undefined,
      });
      setRules(res.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load completeness rules.",
      );
    } finally {
      setLoading(false);
    }
  }, [placeTypeFilter, levelFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteCompletenessRule(id);
        showToast("Rule deleted.");
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to delete rule.",
        );
      }
    },
    [load, showToast],
  );

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <CompletenessRulesSection
        rules={rules}
        loading={loading}
        placeTypeFilter={placeTypeFilter}
        levelFilter={levelFilter}
        onPlaceTypeFilter={setPlaceTypeFilter}
        onLevelFilter={setLevelFilter}
        onDelete={handleDelete}
        onCreateRule={() => setCreateOpen(true)}
      />

      <CreateRuleModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          showToast("Rule created successfully.");
          void load();
        }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}