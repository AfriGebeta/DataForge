// Curated preset catalog — map-editor-full-spec.md §C9, scoped per the
// plan's deliberate cut: ~50 common entries with the spec's real
// scoring/matching mechanism, not iD's full multi-thousand-entry
// data-driven catalog. The raw tag table (OsmEditorPage.tsx's
// TagsEditor) always stays available as a fallback regardless of
// whether a preset matches.

import {
  Ambulance,
  Anchor,
  Armchair,
  Bath,
  Bed,
  Beer,
  Bike,
  Book,
  Building2,
  Bus,
  Church,
  Coffee,
  Cross,
  Croissant,
  Droplet,
  Fuel,
  GraduationCap,
  Hammer,
  Landmark,
  Layers,
  Leaf,
  type LucideIcon,
  MapPin,
  Martini,
  Milestone,
  Mountain,
  Package,
  ParkingCircle,
  Phone,
  Pill,
  Pizza,
  Route,
  Scissors,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Trash2,
  Tractor,
  Train,
  Trees,
  University,
  UtensilsCrossed,
  Waves,
  Wrench,
} from "lucide-react";
import { F, type PresetField } from "./fields";
import type { GeometryRole } from "./geometryRoles";
import type { OsmTags } from "./graph";

export type { PresetField } from "./fields";

export interface Preset {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  geometry: GeometryRole[];
  tags: OsmTags; // the defining match/apply tags
  fields?: PresetField[];
}

const POI_FIELDS: PresetField[] = [F.names, F.address, F.hours, F.phone, F.website, F.wheelchair];

function poi(id: string, name: string, icon: LucideIcon, tags: OsmTags, color = "#c0392b", fields: PresetField[] = POI_FIELDS): Preset {
  return { id, name, icon, color, geometry: ["point", "vertex"], tags, fields };
}

// Street furniture and natural points: a name and little else.
function poiLite(id: string, name: string, icon: LucideIcon, tags: OsmTags, color = "#c0392b", fields: PresetField[] = [F.names]): Preset {
  return poi(id, name, icon, tags, color, fields);
}

function area(id: string, name: string, icon: LucideIcon, tags: OsmTags, color = "#2e7d32", fields: PresetField[] = [F.names]): Preset {
  return { id, name, icon, color, geometry: ["area"], tags, fields };
}

const BUILDING_FIELDS: PresetField[] = [F.building, F.names, F.address, F.levels, F.height, F.roof];
const ROAD_FIELDS: PresetField[] = [F.names, F.ref, F.surface, F.oneway, F.lanes, F.maxspeed, F.lit, F.bridge, F.tunnel];
const PATH_FIELDS: PresetField[] = [F.names, F.surface, F.lit, F.bridge, F.tunnel];
const FOOD_FIELDS: PresetField[] = [F.names, F.cuisine, F.address, F.hours, F.phone, F.website, F.takeaway, F.delivery, F.wheelchair];
const HEALTH_FIELDS: PresetField[] = [F.names, F.operator, F.address, F.hours, F.phone, F.website, F.emergency, F.wheelchair];

function road(id: string, name: string, tags: OsmTags): Preset {
  return { id, name, icon: Route, color: "#555", geometry: ["line"], tags, fields: ROAD_FIELDS };
}

export const PRESETS: Preset[] = [
  // amenity — food & drink
  poi("restaurant", "Restaurant", UtensilsCrossed, { amenity: "restaurant" }, "#c0392b", FOOD_FIELDS),
  poi("cafe", "Cafe", Coffee, { amenity: "cafe" }, "#c0392b", FOOD_FIELDS),
  poi("fast_food", "Fast Food", Pizza, { amenity: "fast_food" }, "#c0392b", FOOD_FIELDS),
  poi("bar", "Bar", Martini, { amenity: "bar" }, "#c0392b", FOOD_FIELDS),
  poi("pub", "Pub", Beer, { amenity: "pub" }, "#c0392b", FOOD_FIELDS),
  poi("bakery_shop", "Bakery", Croissant, { shop: "bakery" }),

  // amenity — civic / services
  poi("bank", "Bank", Landmark, { amenity: "bank" }, "#c0392b", [F.names, F.operator, F.address, F.hours, F.phone, F.atm, F.wheelchair]),
  poi("atm", "ATM", Landmark, { amenity: "atm" }, "#c0392b", [F.names, F.operator]),
  poi("pharmacy", "Pharmacy", Pill, { amenity: "pharmacy" }, "#c0392b", HEALTH_FIELDS),
  poi("hospital", "Hospital", Cross, { amenity: "hospital" }, "#c0392b", HEALTH_FIELDS),
  poi("clinic", "Clinic", Ambulance, { amenity: "clinic" }, "#c0392b", HEALTH_FIELDS),
  poi("police", "Police", Shield, { amenity: "police" }),
  poi("fire_station", "Fire Station", Shield, { amenity: "fire_station" }),
  poi("post_office", "Post Office", Package, { amenity: "post_office" }),
  poi("school", "School", GraduationCap, { amenity: "school" }, "#c0392b", [F.names, F.operator, F.address, F.phone, F.website]),
  poi("university", "University", University, { amenity: "university" }, "#c0392b", [F.names, F.operator, F.address, F.phone, F.website]),
  poi("place_of_worship", "Place of Worship", Church, { amenity: "place_of_worship" }),
  poi("toilets", "Toilets", Droplet, { amenity: "toilets" }),
  poi("fuel", "Fuel Station", Fuel, { amenity: "fuel" }, "#c0392b", [F.names, F.operator, F.address, F.hours, F.phone]),
  poi("parking", "Parking", ParkingCircle, { amenity: "parking" }, "#c0392b", [F.names, F.operator, F.capacity, F.fee]),
  poiLite("bicycle_parking", "Bicycle Parking", Bike, { amenity: "bicycle_parking" }),
  poiLite("waste_basket", "Waste Basket", Trash2, { amenity: "waste_basket" }),
  poiLite("bench", "Bench", Armchair, { amenity: "bench" }),
  poiLite("telephone", "Telephone", Phone, { amenity: "telephone" }),

  // shop
  poi("supermarket", "Supermarket", ShoppingCart, { shop: "supermarket" }),
  poi("convenience", "Convenience Store", Store, { shop: "convenience" }),
  poi("clothes", "Clothes Shop", ShoppingBag, { shop: "clothes" }),
  poi("hairdresser", "Hairdresser", Scissors, { shop: "hairdresser" }),
  poi("hardware", "Hardware Store", Wrench, { shop: "hardware" }),
  poi("electronics", "Electronics Shop", Smartphone, { shop: "electronics" }),
  poi("mobile_phone", "Mobile Phone Shop", Smartphone, { shop: "mobile_phone" }),
  poi("butcher", "Butcher", Store, { shop: "butcher" }),
  poi("books", "Bookshop", Book, { shop: "books" }),

  // tourism
  poi("hotel", "Hotel", Bed, { tourism: "hotel" }),
  poi("guest_house", "Guest House", Bed, { tourism: "guest_house" }),
  poi("attraction", "Tourist Attraction", MapPin, { tourism: "attraction" }),
  poi("museum", "Museum", Landmark, { tourism: "museum" }),

  // leisure / natural
  area("park", "Park", Trees, { leisure: "park" }, "#2e7d32", [F.names, F.hours]),
  area("garden", "Garden", Leaf, { leisure: "garden" }),
  area("playground", "Playground", Trees, { leisure: "playground" }),
  area("pitch", "Sports Pitch", Trees, { leisure: "pitch" }, "#2e7d32", [F.names, F.sport]),
  poiLite("tree", "Tree", Trees, { natural: "tree" }, "#2e7d32"),
  area("wood", "Wood", Trees, { natural: "wood" }),
  area("water", "Water", Waves, { natural: "water" }, "#1976d2"),
  poiLite("peak", "Peak", Mountain, { natural: "peak" }),

  // buildings / landuse (areas)
  area("building", "Building", Building2, { building: "yes" }, "#8d6e63", BUILDING_FIELDS),
  area("house", "House", Building2, { building: "house" }, "#8d6e63", BUILDING_FIELDS),
  area("apartments", "Apartments", Building2, { building: "apartments" }, "#8d6e63", BUILDING_FIELDS),
  area("commercial_building", "Commercial Building", Building2, { building: "commercial" }, "#8d6e63", BUILDING_FIELDS),
  area("landuse_residential", "Residential Area", Layers, { landuse: "residential" }),
  area("landuse_commercial", "Commercial Area", Layers, { landuse: "commercial" }),
  area("landuse_industrial", "Industrial Area", Hammer, { landuse: "industrial" }),
  area("landuse_farmland", "Farmland", Tractor, { landuse: "farmland" }),

  // highways / paths (lines)
  road("motorway", "Motorway", { highway: "motorway" }),
  road("primary", "Primary Road", { highway: "primary" }),
  road("secondary", "Secondary Road", { highway: "secondary" }),
  road("tertiary", "Tertiary Road", { highway: "tertiary" }),
  road("residential_road", "Residential Road", { highway: "residential" }),
  road("service_road", "Service Road", { highway: "service" }),
  road("track", "Track", { highway: "track" }),
  { id: "footway", name: "Footway", icon: Route, color: "#555", geometry: ["line"], tags: { highway: "footway" }, fields: PATH_FIELDS },
  { id: "path", name: "Path", icon: Milestone, color: "#555", geometry: ["line"], tags: { highway: "path" }, fields: PATH_FIELDS },
  { id: "cycleway", name: "Cycleway", icon: Bike, color: "#555", geometry: ["line"], tags: { highway: "cycleway" }, fields: PATH_FIELDS },
  { id: "steps", name: "Steps", icon: Milestone, color: "#555", geometry: ["line"], tags: { highway: "steps" }, fields: [] },

  // rail / waterway / other lines
  { id: "railway_rail", name: "Railway", icon: Train, color: "#555", geometry: ["line"], tags: { railway: "rail" }, fields: [F.names] },
  { id: "railway_station", name: "Railway Station", icon: Train, color: "#c0392b", geometry: ["point", "vertex"], tags: { railway: "station" }, fields: [F.names] },
  { id: "bus_stop", name: "Bus Stop", icon: Bus, color: "#c0392b", geometry: ["point", "vertex"], tags: { highway: "bus_stop" }, fields: [F.names] },
  { id: "waterway_river", name: "River", icon: Waves, color: "#1976d2", geometry: ["line"], tags: { waterway: "river" }, fields: [F.names] },
  { id: "waterway_stream", name: "Stream", icon: Waves, color: "#1976d2", geometry: ["line"], tags: { waterway: "stream" }, fields: [F.names] },
  { id: "pier", name: "Pier", icon: Anchor, color: "#555", geometry: ["line", "area"], tags: { man_made: "pier" }, fields: [F.names] },
  { id: "bath", name: "Bath House", icon: Bath, color: "#c0392b", geometry: ["point", "vertex"], tags: { amenity: "public_bath" }, fields: [F.names] },
];

// §C9's scoring: the preset whose match-tags are the largest fully-
// satisfied subset of the entity's own tags wins (most-specific match,
// not just first-hit) — a preset requiring 2 matching keys beats one
// requiring only 1 if both are fully satisfied.
export function matchPreset(tags: OsmTags, role: GeometryRole): Preset | null {
  let best: Preset | null = null;
  let bestScore = 0;
  for (const preset of PRESETS) {
    if (!preset.geometry.includes(role)) continue;
    const entries = Object.entries(preset.tags);
    if (entries.length === 0) continue;
    const matched = entries.every(([k, v]) => tags[k] === v);
    if (!matched) continue;
    if (entries.length > bestScore) {
      best = preset;
      bestScore = entries.length;
    }
  }
  return best;
}

export function searchPresets(query: string, role: GeometryRole): Preset[] {
  const candidates = PRESETS.filter((p) => p.geometry.includes(role));
  if (!query.trim()) return candidates.slice(0, 30);
  const q = query.trim().toLowerCase();
  return candidates.filter((p) => p.name.toLowerCase().includes(q) || Object.values(p.tags).some((v) => v.toLowerCase().includes(q)));
}
