// Shared types + the self-intersection guard for Draw Line/Area (spec
// §C2.8): "every new segment is checked against the rest of the
// way-in-progress; if committing a point would make the line cross
// itself, the cursor switches to a blocked visual state and the click
// is rejected, unless the user holds an override modifier key."

import kinks from "@turf/kinks";
import { lineString } from "@turf/helpers";

export interface DrawPoint {
  lat: number;
  lon: number;
  // Set when this point snapped exactly onto an existing node — reuse
  // that node's id instead of creating a new one.
  existingNodeId?: number;
  // Set when this point snapped onto a way's interior — insert the
  // (new or reused) node into that way at this segment position.
  insertIntoWay?: { wayId: number; atIndex: number };
}

export function wouldSelfIntersect(points: { lat: number; lon: number }[]): boolean {
  if (points.length < 3) return false;
  const coords = points.map((p) => [p.lon, p.lat]);
  try {
    return kinks(lineString(coords)).features.length > 0;
  } catch {
    // Degenerate input (e.g. a repeated point) — not our concern here,
    // let the draw session continue rather than false-block the user.
    return false;
  }
}
