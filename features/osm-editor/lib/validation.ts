// Validation engine — map-editor-full-spec.md §1.10's save-review gate:
// "errors block the upload, warnings are shown but don't." Scoped to
// the entities actually touched by the pending diff (not the whole
// loaded graph) — this is about catching problems in *this* edit
// session, not auditing pre-existing data.

import type { Graph } from "./graph";
import type { EntityType } from "./graph";
import type { GraphDiff } from "./diff";
import { matchPreset } from "./presets";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  entity: { type: EntityType; id: number };
}

export function validateDiff(graph: Graph, diff: GraphDiff): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const touchedWays = [...diff.createdWays, ...diff.modifiedWays];
  const touchedNodes = [...diff.createdNodes, ...diff.modifiedNodes];

  for (const way of touchedWays) {
    for (let i = 0; i < way.nodeIds.length - 1; i++) {
      if (way.nodeIds[i] === way.nodeIds[i + 1]) {
        issues.push({ severity: "error", message: "Line has a zero-length segment (the same point twice in a row).", entity: { type: "way", id: way.id } });
        break;
      }
    }

    const closed = way.nodeIds.length >= 2 && way.nodeIds[0] === way.nodeIds[way.nodeIds.length - 1];
    if (!closed && way.nodeIds.length >= 2) {
      for (const endId of [way.nodeIds[0], way.nodeIds[way.nodeIds.length - 1]]) {
        if (graph.parentWays(endId).length === 1) {
          issues.push({ severity: "warning", message: "Line has an unconnected end.", entity: { type: "way", id: way.id } });
          break;
        }
      }
    }
  }

  const standalonePoints = graph.visibleNodes().filter((n) => graph.parentWays(n.id).length === 0);
  for (const node of touchedNodes) {
    if (graph.parentWays(node.id).length > 0) continue; // a vertex, not a standalone point
    const dup = standalonePoints.find((n) => n.id !== node.id && n.lat === node.lat && n.lon === node.lon);
    if (dup) {
      issues.push({ severity: "warning", message: `Sits at the exact same location as node #${dup.id}.`, entity: { type: "node", id: node.id } });
    }
  }

  for (const node of touchedNodes) {
    const role = graph.parentWays(node.id).length > 0 ? "vertex" : "point";
    const preset = matchPreset(node.tags, role);
    if (preset?.fields?.some((f) => f.key === "name") && !node.tags.name?.trim()) {
      issues.push({ severity: "warning", message: `${preset.name} has no name set.`, entity: { type: "node", id: node.id } });
    }
  }

  return issues;
}
