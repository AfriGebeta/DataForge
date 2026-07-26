import type {
  CreatePlaceRequest,
  Place,
  PlaceListParams,
  PlaceListResponse,
  UpdatePlaceRequest,
} from "./types";

/** Base path for the Place API. */
export const API_ENDPOINT = "http://localhost:8080/api/v1/places" as const;

/* ──────────────── Mock data ──────────────── */

const fakePlaces: Place[] = [
  {
    id: 1,
    placeType: "POI",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000002",
    latitude: 9.0222,
    longitude: 38.7468,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "APPROVED",
    reviewReason: "Manually verified by admin",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-26T12:00:00Z",
    updatedAt: "2026-07-26T12:00:00Z",
    names: [
      { id: "e2c34d83-4a6c-48be-81f1-37d45f3c983a", languageCode: "en", name: "Tomoca Coffee", nameType: "PRIMARY", isPrimary: true, displayOrder: 0 },
      { id: "f3d45e94-5b7d-59cf-92g2-48e56g4d094b", languageCode: "am", name: "ቶሞካ ቡና", nameType: "LOCAL", isPrimary: false, displayOrder: 1 },
    ],
    address: { countryIso2: "ET", streetName: { en: "Wawel St", am: "ዋዌል ጎዳና" }, streetNumber: "123", formattedFull: { en: "Wawel St 123, Addis Ababa, Ethiopia", am: "ዋዌል ጎዳና 123, አዲስ አበባ, ኢትዮጵያ" } },
    contacts: [{ id: "a95b8d21-f49a-4c28-912b-31a89c42021a", type: "PHONE", value: "+251911234567", label: "Main Branch" }],
    openingHours: [{ id: "781cf42a-912b-4c28-f49a-31a89c42021b", weekday: 1, opensAt: "07:00", closesAt: "20:00", isClosed: false, is24Hours: false }],
    attributes: [{ id: "b12cf42a-912b-4c28-f49a-31a89c42021c", key: "has_wifi", value: true, valueType: "BOOLEAN", isPrimary: true }],
    images: [{ id: "c12cf42a-912b-4c28-f49a-31a89c42021d", url: "https://example.com/tomoca_main.jpg", isPrimary: true, blurhash: "LEHV6nWB2yk8pyoJadR*.7kCMdnj" }],
    aiValues: { aiGeoScore: 0.98, aiDecision: "VALID", aiReasons: { verified_by: "google_maps_cross_check" } },
  },
  {
    id: 2,
    placeType: "CAFE",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000002",
    latitude: 9.0145,
    longitude: 38.7636,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "PENDING",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-25T09:30:00Z",
    updatedAt: "2026-07-25T09:30:00Z",
    names: [{ languageCode: "en", name: "Kaldi's Coffee", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "Bole Road" }, streetNumber: "45" },
    contacts: [{ type: "PHONE", value: "+251912345678", label: "General" }],
    openingHours: [],
    attributes: [],
    images: [],
  },
  {
    id: 3,
    placeType: "RESTAURANT",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000001",
    latitude: 9.0312,
    longitude: 38.7521,
    geometryType: "Point",
    isActive: false,
    isVisible: true,
    reviewStatus: "FLAGGED",
    reviewReason: "Possible duplicate detected",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 2,
    createdAt: "2026-07-20T14:00:00Z",
    updatedAt: "2026-07-24T16:45:00Z",
    names: [{ languageCode: "en", name: "Yod Abyssinia", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "Kazanchis" } },
    contacts: [{ type: "EMAIL", value: "info@yodethiopia.com", label: "Info" }],
    openingHours: [{ weekday: 1, opensAt: "11:00", closesAt: "23:00", isClosed: false, is24Hours: false }],
    attributes: [{ key: "has_parking", value: true, valueType: "BOOLEAN" }],
    images: [],
  },
  {
    id: 4,
    placeType: "HOTEL",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000003",
    latitude: 9.0112,
    longitude: 38.7521,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "PENDING",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-26T08:00:00Z",
    updatedAt: "2026-07-26T08:00:00Z",
    names: [{ languageCode: "en", name: "Skylight Hotel", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "Airport Road" } },
    contacts: [{ type: "PHONE", value: "+251912345679", label: "Reception" }],
    openingHours: [{ weekday: 1, opensAt: "00:00", closesAt: "23:59", isClosed: false, is24Hours: true }],
    attributes: [{ key: "has_wifi", value: true, valueType: "BOOLEAN" }, { key: "has_pool", value: true, valueType: "BOOLEAN" }],
    images: [],
  },
  {
    id: 5,
    placeType: "BANK",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000004",
    latitude: 9.0150,
    longitude: 38.7490,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "APPROVED",
    reviewReason: "Verified by internal team",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-25T11:20:00Z",
    updatedAt: "2026-07-25T11:20:00Z",
    names: [{ languageCode: "en", name: "Commercial Bank of Ethiopia", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "Churchill Ave" } },
    contacts: [],
    openingHours: [],
    attributes: [{ key: "has_atm", value: true, valueType: "BOOLEAN" }],
    images: [],
  },
  {
    id: 6,
    placeType: "HOSPITAL",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000005",
    latitude: 9.0200,
    longitude: 38.7300,
    geometryType: "Polygon",
    isActive: true,
    isVisible: true,
    reviewStatus: "FLAGGED",
    reviewReason: "Missing required contact info",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 3,
    createdAt: "2026-07-20T10:00:00Z",
    updatedAt: "2026-07-26T09:15:00Z",
    names: [{ languageCode: "en", name: "Black Lion Hospital", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET" },
    contacts: [],
    openingHours: [{ weekday: 1, opensAt: "00:00", closesAt: "23:59", isClosed: false, is24Hours: true }],
    attributes: [{ key: "emergency_room", value: true, valueType: "BOOLEAN" }],
    images: [],
  },
  {
    id: 7,
    placeType: "SCHOOL",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000006",
    latitude: 9.0250,
    longitude: 38.7400,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "APPROVED",
    reviewReason: "Verified school district",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-15T08:00:00Z",
    updatedAt: "2026-07-15T08:00:00Z",
    names: [{ languageCode: "en", name: "Addis Ababa University", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "King George VI St" } },
    contacts: [{ type: "WEBSITE", value: "aau.edu.et", label: "Official Site" }],
    openingHours: [{ weekday: 1, opensAt: "08:00", closesAt: "17:00", isClosed: false, is24Hours: false }],
    attributes: [],
    images: [],
  },
  {
    id: 8,
    placeType: "GOVERNMENT",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000007",
    latitude: 9.0180,
    longitude: 38.7610,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "PENDING",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-26T10:00:00Z",
    updatedAt: "2026-07-26T10:00:00Z",
    names: [{ languageCode: "en", name: "Ministry of Health", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "Sudan St" } },
    contacts: [],
    openingHours: [],
    attributes: [],
    images: [],
  },
  {
    id: 9,
    placeType: "WORSHIP",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000008",
    latitude: 9.0305,
    longitude: 38.7645,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "APPROVED",
    reviewReason: "Community verified",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-06-12T09:00:00Z",
    updatedAt: "2026-06-12T09:00:00Z",
    names: [{ languageCode: "en", name: "Holy Trinity Cathedral", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET", streetName: { en: "Arat Kilo" } },
    contacts: [],
    openingHours: [],
    attributes: [],
    images: [],
  },
  {
    id: 10,
    placeType: "PARK",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000009",
    latitude: 9.0280,
    longitude: 38.7500,
    geometryType: "Polygon",
    isActive: true,
    isVisible: true,
    reviewStatus: "REJECTED",
    reviewReason: "Location data inaccurate",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-22T14:30:00Z",
    updatedAt: "2026-07-22T14:30:00Z",
    names: [{ languageCode: "en", name: "Unity Park", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET" },
    contacts: [],
    openingHours: [],
    attributes: [],
    images: [],
  },
  {
    id: 11,
    placeType: "TRANSPORT",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000010",
    latitude: 9.0350,
    longitude: 38.7550,
    geometryType: "Point",
    isActive: true,
    isVisible: true,
    reviewStatus: "APPROVED",
    reviewReason: "Public transit station",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-05-18T07:15:00Z",
    updatedAt: "2026-05-18T07:15:00Z",
    names: [{ languageCode: "en", name: "Stadium Light Rail Station", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET" },
    contacts: [],
    openingHours: [],
    attributes: [],
    images: [],
  },
  {
    id: 12,
    placeType: "OTHER",
    accessType: "PUBLIC",
    categoryId: "3f7a9e0e-1111-4a11-8a11-000000000011",
    latitude: 9.0400,
    longitude: 38.7600,
    geometryType: "Point",
    isActive: true,
    isVisible: false,
    reviewStatus: "FLAGGED",
    reviewReason: "Needs more info",
    completenessScore: 0,
    completenessLevel: "BASIC",
    version: 1,
    createdAt: "2026-07-25T16:45:00Z",
    updatedAt: "2026-07-25T16:45:00Z",
    names: [{ languageCode: "en", name: "Unknown Facility", nameType: "PRIMARY", isPrimary: true }],
    address: { countryIso2: "ET" },
    contacts: [],
    openingHours: [],
    attributes: [],
    images: [],
  },
];

/* ──────────────── API functions ──────────────── */

/** GET /api/v1/places — List places with optional filtering/pagination */
export async function fetchPlaces(params?: PlaceListParams): Promise<PlaceListResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.search) query.set("search", params.search);
    if (params?.placeType) query.set("placeType", params.placeType);
    if (params?.reviewStatus) query.set("reviewStatus", params.reviewStatus);
    const qs = query.toString();
    const res = await fetch(`${API_ENDPOINT}${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchPlaces:", cause);
    let filtered = [...fakePlaces];
    if (params?.placeType) filtered = filtered.filter((p) => p.placeType === params.placeType);
    if (params?.reviewStatus) filtered = filtered.filter((p) => p.reviewStatus === params.reviewStatus);
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.names.some((n) => n.name.toLowerCase().includes(q)) ||
        String(p.id).includes(q),
      );
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    return { data: filtered.slice(offset, offset + pageSize), total: filtered.length, limit: pageSize, offset };
  }
}

/** GET /api/v1/places/{id} — Get a single place with all relations */
export async function fetchPlace(id: number): Promise<Place> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchPlace:", cause);
    const place = fakePlaces.find((p) => p.id === id);
    if (!place) throw new Error("Place not found");
    return place;
  }
}

/** POST /api/v1/places — Create a new place */
export async function createPlace(request: CreatePlaceRequest): Promise<Place> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      let msg = `Request failed with status ${res.status}`;
      try { const body = await res.json(); if (body?.message) msg = body.message; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock for createPlace:", cause);
    const newPlace: Place = {
      id: Date.now(),
      ...request,
      completenessScore: 0,
      completenessLevel: "BASIC",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      names: request.names as Place["names"],
      contacts: (request.contacts ?? []) as Place["contacts"],
      openingHours: (request.openingHours ?? []) as Place["openingHours"],
      attributes: (request.attributes ?? []) as Place["attributes"],
      images: (request.images ?? []) as Place["images"],
    };
    fakePlaces.unshift(newPlace);
    return newPlace;
  }
}

/** PUT /api/v1/places/{id} — Partial update */
export async function updatePlace(id: number, request: UpdatePlaceRequest): Promise<Place> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      let msg = `Request failed with status ${res.status}`;
      try { const body = await res.json(); if (body?.message) msg = body.message; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock for updatePlace:", cause);
    const idx = fakePlaces.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Place not found");
    const updated = { ...fakePlaces[idx], ...request, updatedAt: new Date().toISOString() } as Place;
    fakePlaces[idx] = updated;
    return updated;
  }
}

/** DELETE /api/v1/places/{id} */
export async function deletePlace(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for deletePlace:", cause);
    const idx = fakePlaces.findIndex((p) => p.id === id);
    if (idx !== -1) fakePlaces.splice(idx, 1);
  }
}
