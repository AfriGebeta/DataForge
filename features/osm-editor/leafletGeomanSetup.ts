// Duplicated from features/address/nodes/leafletGeomanSetup.ts — see that
// file's comment for why this needs to run before
// "@geoman-io/leaflet-geoman-free" is imported. This codebase's convention
// is to duplicate small map-support files per feature rather than share one
// below page-level (see AddressMap.tsx's own comment on the same point).
import L from "leaflet";

if (typeof window !== "undefined") {
  (window as unknown as { L: typeof L }).L = L;
}
