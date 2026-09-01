// Domain types for the Address -> Informal Areas page — a curated
// gazetteer of colloquially-known places with no formal administrative
// standing (e.g. "Megenagna"), deliberately separate from the Address
// hierarchy (see ./nodes) rather than another admin-level node. Backed by
// PlaceForge's informal-area module (src/modules/informal-area).

export type InformalArea = {
  id: string;
  name: Record<string, string>;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};

export function informalAreaName(area: Pick<InformalArea, "name">): string {
  return area.name.en ?? Object.values(area.name)[0] ?? "(unnamed)";
}
