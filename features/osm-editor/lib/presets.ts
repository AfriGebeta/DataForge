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
import type { GeometryRole } from "./geometryRoles";
import type { OsmTags } from "./graph";

export interface PresetField {
  key: string;
  label: string;
  placeholder?: string;
}

export interface Preset {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  geometry: GeometryRole[];
  tags: OsmTags; // the defining match/apply tags
  fields?: PresetField[];
}

const NAME_FIELD: PresetField = { key: "name", label: "Name" };

function poi(id: string, name: string, icon: LucideIcon, tags: OsmTags, color = "#c0392b"): Preset {
  return { id, name, icon, color, geometry: ["point", "vertex"], tags, fields: [NAME_FIELD] };
}

function area(id: string, name: string, icon: LucideIcon, tags: OsmTags, color = "#2e7d32"): Preset {
  return { id, name, icon, color, geometry: ["area"], tags, fields: [NAME_FIELD] };
}

function road(id: string, name: string, tags: OsmTags): Preset {
  return { id, name, icon: Route, color: "#555", geometry: ["line"], tags, fields: [NAME_FIELD, { key: "maxspeed", label: "Speed limit" }] };
}

export const PRESETS: Preset[] = [
  // amenity — food & drink
  poi("restaurant", "Restaurant", UtensilsCrossed, { amenity: "restaurant" }),
  poi("cafe", "Cafe", Coffee, { amenity: "cafe" }),
  poi("fast_food", "Fast Food", Pizza, { amenity: "fast_food" }),
  poi("bar", "Bar", Martini, { amenity: "bar" }),
  poi("pub", "Pub", Beer, { amenity: "pub" }),
  poi("bakery_shop", "Bakery", Croissant, { shop: "bakery" }),

  // amenity — civic / services
  poi("bank", "Bank", Landmark, { amenity: "bank" }),
  poi("atm", "ATM", Landmark, { amenity: "atm" }),
  poi("pharmacy", "Pharmacy", Pill, { amenity: "pharmacy" }),
  poi("hospital", "Hospital", Cross, { amenity: "hospital" }),
  poi("clinic", "Clinic", Ambulance, { amenity: "clinic" }),
  poi("police", "Police", Shield, { amenity: "police" }),
  poi("fire_station", "Fire Station", Shield, { amenity: "fire_station" }),
  poi("post_office", "Post Office", Package, { amenity: "post_office" }),
  poi("school", "School", GraduationCap, { amenity: "school" }),
  poi("university", "University", University, { amenity: "university" }),
  poi("place_of_worship", "Place of Worship", Church, { amenity: "place_of_worship" }),
  poi("toilets", "Toilets", Droplet, { amenity: "toilets" }),
  poi("fuel", "Fuel Station", Fuel, { amenity: "fuel" }),
  poi("parking", "Parking", ParkingCircle, { amenity: "parking" }),
  poi("bicycle_parking", "Bicycle Parking", Bike, { amenity: "bicycle_parking" }),
  poi("waste_basket", "Waste Basket", Trash2, { amenity: "waste_basket" }),
  poi("bench", "Bench", Armchair, { amenity: "bench" }),
  poi("telephone", "Telephone", Phone, { amenity: "telephone" }),

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
  area("park", "Park", Trees, { leisure: "park" }),
  area("garden", "Garden", Leaf, { leisure: "garden" }),
  area("playground", "Playground", Trees, { leisure: "playground" }),
  area("pitch", "Sports Pitch", Trees, { leisure: "pitch" }),
  poi("tree", "Tree", Trees, { natural: "tree" }, "#2e7d32"),
  area("wood", "Wood", Trees, { natural: "wood" }),
  area("water", "Water", Waves, { natural: "water" }, "#1976d2"),
  poi("peak", "Peak", Mountain, { natural: "peak" }),

  // buildings / landuse (areas)
  area("building", "Building", Building2, { building: "yes" }, "#8d6e63"),
  area("house", "House", Building2, { building: "house" }, "#8d6e63"),
  area("apartments", "Apartments", Building2, { building: "apartments" }, "#8d6e63"),
  area("commercial_building", "Commercial Building", Building2, { building: "commercial" }, "#8d6e63"),
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
  { id: "footway", name: "Footway", icon: Route, color: "#555", geometry: ["line"], tags: { highway: "footway" }, fields: [NAME_FIELD] },
  { id: "path", name: "Path", icon: Milestone, color: "#555", geometry: ["line"], tags: { highway: "path" }, fields: [NAME_FIELD] },
  { id: "cycleway", name: "Cycleway", icon: Bike, color: "#555", geometry: ["line"], tags: { highway: "cycleway" }, fields: [NAME_FIELD] },
  { id: "steps", name: "Steps", icon: Milestone, color: "#555", geometry: ["line"], tags: { highway: "steps" }, fields: [] },

  // rail / waterway / other lines
  { id: "railway_rail", name: "Railway", icon: Train, color: "#555", geometry: ["line"], tags: { railway: "rail" }, fields: [NAME_FIELD] },
  { id: "railway_station", name: "Railway Station", icon: Train, color: "#c0392b", geometry: ["point", "vertex"], tags: { railway: "station" }, fields: [NAME_FIELD] },
  { id: "bus_stop", name: "Bus Stop", icon: Bus, color: "#c0392b", geometry: ["point", "vertex"], tags: { highway: "bus_stop" }, fields: [NAME_FIELD] },
  { id: "waterway_river", name: "River", icon: Waves, color: "#1976d2", geometry: ["line"], tags: { waterway: "river" }, fields: [NAME_FIELD] },
  { id: "waterway_stream", name: "Stream", icon: Waves, color: "#1976d2", geometry: ["line"], tags: { waterway: "stream" }, fields: [NAME_FIELD] },
  { id: "pier", name: "Pier", icon: Anchor, color: "#555", geometry: ["line", "area"], tags: { man_made: "pier" }, fields: [NAME_FIELD] },
  { id: "bath", name: "Bath House", icon: Bath, color: "#c0392b", geometry: ["point", "vertex"], tags: { amenity: "public_bath" }, fields: [NAME_FIELD] },
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
