// Label placement — map-editor-full-spec.md §3's labeling system,
// approximated: priority order (primary-classification index, lower =
// more important) plus simple AABB collision suppression in screen-
// pixel space, rather than a pixel-identical port of a full label
// text-measurement/collision engine.

import type L from "leaflet";
import { classifyPrimary, type PrimaryClass } from "./styles";
import type { OsmTags } from "./graph";

export interface LabelCandidate {
  key: string;
  name: string;
  lat: number;
  lon: number;
}

function priorityOf(primary: PrimaryClass | null): number {
  if (!primary) return 999;
  const order = ["building", "highway", "railway", "waterway", "aeroway", "amenity", "shop", "leisure", "natural", "landuse"];
  const idx = order.indexOf(primary.key);
  return idx === -1 ? 500 : idx;
}

export function labelCandidate(key: string, tags: OsmTags, lat: number, lon: number): LabelCandidate | null {
  if (!tags.name) return null;
  return { key, name: tags.name, lat, lon };
}

export function planLabels(map: L.Map, candidates: LabelCandidate[], tagsByKey: Map<string, OsmTags>): Set<string> {
  const sorted = [...candidates].sort((a, b) => {
    const pa = priorityOf(classifyPrimary(tagsByKey.get(a.key) ?? {}));
    const pb = priorityOf(classifyPrimary(tagsByKey.get(b.key) ?? {}));
    return pa - pb;
  });

  const placed: { minX: number; minY: number; maxX: number; maxY: number }[] = [];
  const result = new Set<string>();
  for (const c of sorted) {
    const p = map.latLngToContainerPoint([c.lat, c.lon]);
    const width = c.name.length * 6 + 8;
    const height = 16;
    const box = { minX: p.x - width / 2, minY: p.y + 4, maxX: p.x + width / 2, maxY: p.y + 4 + height };
    const collides = placed.some((b) => !(box.maxX < b.minX || box.minX > b.maxX || box.maxY < b.minY || box.minY > b.maxY));
    if (collides) continue;
    placed.push(box);
    result.add(c.key);
  }
  return result;
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
