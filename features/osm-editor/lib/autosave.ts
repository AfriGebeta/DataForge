// Autosave / crash recovery — map-editor-full-spec.md §1.10: a periodic
// local snapshot of in-progress work, offered back on the next load.
//
// Stores *both* the diff baseline (serverGraph) and the working graph,
// not just a merged view — restoring only the working graph would make
// every entity look brand-new against an empty baseline on the next
// save, hitting the same "duplicates a real entity instead of modifying
// it" failure class as bug-090 (see RelationMembership.tsx/buglog.json).

import { Graph, type Entity } from "./graph";

const KEY = "osm-editor:autosave";

export interface AutosaveSnapshot {
  changesetId: number;
  savedAt: string;
  serverEntities: Entity[];
  headEntities: Entity[];
}

export function writeSnapshot(changesetId: number, serverGraph: Graph, headGraph: Graph): void {
  if (typeof window === "undefined") return;
  const snapshot: AutosaveSnapshot = {
    changesetId,
    savedAt: new Date().toISOString(),
    serverEntities: serverGraph.all(),
    headEntities: headGraph.all(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // quota/private-browsing — autosave is best-effort, not worth surfacing an error over
  }
}

export function readSnapshot(): AutosaveSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveSnapshot;
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function snapshotToGraphs(snapshot: AutosaveSnapshot): { serverGraph: Graph; headGraph: Graph } {
  return { serverGraph: Graph.fromEntities(snapshot.serverEntities), headGraph: Graph.fromEntities(snapshot.headEntities) };
}
