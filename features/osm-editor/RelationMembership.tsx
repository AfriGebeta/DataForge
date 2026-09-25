"use client";

// Relation membership editor — the frontend gap OSM_EDITING.md flagged
// ("no relation-builder UI... relations can still enter the system
// today via .osm import/osmChange upload"). This doesn't build a full
// multipolygon/turn-restriction builder either, but it closes the
// bigger gap: an existing relation's membership can now actually be
// viewed and edited from the map editor, not just via raw XML.

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { getRelation } from "./api";
import * as graphActions from "./lib/actions";
import { apiRelationToMembers } from "./lib/convert";
import type { RelationEntity } from "./lib/graph";
import type { EditorStore } from "./useEditorStore";

const fieldInputClass =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[11px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";

export default function RelationMembership({
  store,
  entryType,
  entryId,
}: {
  store: EditorStore;
  entryType: "node" | "way";
  entryId: number;
}) {
  const { graph } = store;
  const memberOf = graph.parentRelations(entryType, entryId);

  const [relationIdInput, setRelationIdInput] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function removeFrom(relation: RelationEntity) {
    const atIndex = relation.members.findIndex((m) => m.type === entryType && m.ref === entryId);
    if (atIndex === -1) return;
    store.commitGraph(graphActions.removeRelationMember(graph, relation.id, atIndex));
  }

  async function addToExisting() {
    const id = Number(relationIdInput.trim());
    if (!Number.isFinite(id) || id <= 0) {
      setError("Enter a valid relation id.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let target = graph.relation(id);
      let g = graph;
      if (!target) {
        // Not already loaded (e.g. outside the current bbox) — fetch it
        // directly so its membership can still be edited. Registering it
        // as a server entity too (not just adding to the working graph)
        // is what makes the diff see this as a *modify* of the real
        // relation on save, instead of defensively treating an unknown-
        // to-serverGraph positive id as a fresh create and duplicating it.
        const fetched = await getRelation(id);
        target = { type: "relation", id: fetched.id, version: fetched.version, visible: fetched.visible, tags: fetched.tags ?? {}, members: apiRelationToMembers(fetched) };
        store.registerServerEntity(target);
        g = g.replace(target);
      }
      g = graphActions.addRelationMember(g, target.id, { type: entryType, ref: entryId, role: role.trim() });
      store.commitGraph(g);
      setRelationIdInput("");
      setRole("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Relation not found.");
    } finally {
      setBusy(false);
    }
  }

  function createNewRelation() {
    const id = store.allocateId("relation");
    store.commitGraph(graphActions.createRelation(graph, id, [{ type: entryType, ref: entryId, role: role.trim() }], {}));
    store.select({ type: "relation", id }, false);
    setRole("");
  }

  return (
    <div className="mt-2 border-t border-[color:var(--border)] pt-2">
      <div className="mb-1 text-[10px] text-[color:var(--text-muted)]">Relation membership</div>
      {memberOf.length === 0 ? (
        <div className="mb-1.5 text-[11px] text-[color:var(--text-muted)]">Not a member of any relation.</div>
      ) : (
        <div className="mb-1.5 flex flex-col gap-1">
          {memberOf.map((r) => {
            const member = r.members.find((m) => m.type === entryType && m.ref === entryId);
            return (
              <div key={r.id} className="flex items-center justify-between gap-1.5 rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[11px]">
                <span className="truncate text-[color:var(--text-primary)]">
                  relation #{r.id}
                  {r.tags.type ? ` (${r.tags.type})` : ""}
                  {member?.role ? <span className="text-[color:var(--text-muted)]"> · {member.role}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => removeFrom(r)}
                  title="Remove from this relation"
                  className="shrink-0 rounded p-0.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-danger)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1">
        <input
          value={relationIdInput}
          onChange={(e) => setRelationIdInput(e.target.value)}
          placeholder="relation id"
          className={`${fieldInputClass} w-20`}
        />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="role" className={`${fieldInputClass} flex-1`} />
        <button
          type="button"
          onClick={() => void addToExisting()}
          disabled={busy || !relationIdInput.trim()}
          className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1.5 text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40"
          title="Add to existing relation"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={createNewRelation}
        className="mt-1 text-[10px] text-[color:var(--text-accent)] hover:underline"
      >
        + Create a new relation with this member
      </button>
      {error ? <div className="mt-1 text-[10px] text-[color:var(--text-danger)]">{error}</div> : null}
    </div>
  );
}
