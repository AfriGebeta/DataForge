/** Domain types for Place API — aligned with backend contracts. */

export type PlaceType = "POI" | "CAFE" | "RESTAURANT" | "HOTEL" | "SHOP" | "BANK" | "HOSPITAL" | "SCHOOL" | "GOVERNMENT" | "WORSHIP" | "TRANSPORT" | "PARK" | "OTHER";
export type AccessType = "PUBLIC" | "PRIVATE" | "RESTRICTED";
export type GeometryType = "Point" | "Polygon" | "MultiPolygon";
export type ReviewStatus = "PENDING" | "APPROVED" | "FLAGGED" | "REJECTED";
export type NameType = "PRIMARY" | "LOCAL" | "ALTERNATE" | "OFFICIAL";
export type ContactType = "PHONE" | "EMAIL" | "WEBSITE" | "FAX" | "SOCIAL";
export type AttributeValueType = "BOOLEAN" | "STRING" | "NUMBER" | "JSON";

/* ──────────────── Sub-entities ──────────────── */

export type PlaceName = {
  id?: string;
  languageCode: string;
  name: string;
  nameType: NameType;
  isPrimary: boolean;
  displayOrder?: number;
};

export type PlaceAddress = {
  countryIso2: string;
  streetName?: Record<string, string>;
  streetNumber?: string;
  formattedFull?: Record<string, string>;
};

export type PlaceContact = {
  id?: string;
  type: ContactType;
  value: string;
  label?: string;
};

export type PlaceOpeningHour = {
  id?: string;
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  is24Hours: boolean;
};

export type PlaceAttribute = {
  id?: string;
  key: string;
  value: unknown;
  valueType: AttributeValueType;
  isPrimary?: boolean;
};

export type PlaceImage = {
  id?: string;
  url: string;
  isPrimary: boolean;
  blurhash?: string;
};

export type PlaceAiValues = {
  aiGeoValid?: boolean | null;
  aiGeoScore?: number | null;
  aiNameValid?: boolean | null;
  aiNameScore?: number | null;
  aiDuplicateScore?: number | null;
  aiMlConfidence?: number | null;
  aiOverallScore?: number | null;
  aiDecision?: string | null;
  aiReasons?: Record<string, string> | null;
  aiValidatedAt?: string | null;
};

/* ──────────────── Main Place entity ──────────────── */

export type Place = {
  id: number;
  placeType: PlaceType;
  accessType: AccessType;
  categoryId: string;
  latitude: number;
  longitude: number;
  geometryType: GeometryType;
  areaCoordinates?: number[][];
  bboxMinLat?: number;
  bboxMinLng?: number;
  bboxMaxLat?: number;
  bboxMaxLng?: number;
  geocodeConfidence?: number | null;
  geocodeMethod?: string | null;
  areaSqMeters?: number | null;
  elevationMeters?: number | null;
  buildingLevels?: number | null;
  establishedAt?: string | null;
  dateClosed?: string | null;
  isActive: boolean;
  isVisible: boolean;
  reviewStatus: ReviewStatus;
  reviewReason?: string | null;
  completenessScore?: number;
  completenessLevel?: string;
  placeRank?: number;
  displayRank?: number;
  minZoom?: number;
  maxZoom?: number;
  osmRank?: number | null;
  version?: number;
  lastEnrichedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  names: PlaceName[];
  address?: PlaceAddress | null;
  contacts: PlaceContact[];
  openingHours: PlaceOpeningHour[];
  attributes: PlaceAttribute[];
  images: PlaceImage[];
  aiValues?: PlaceAiValues | null;
};

/* ──────────────── Request types ──────────────── */

export type CreatePlaceRequest = {
  placeType: PlaceType;
  accessType: AccessType;
  categoryId: string;
  latitude: number;
  longitude: number;
  geometryType: GeometryType;
  areaCoordinates?: number[][];
  bboxMinLat?: number;
  bboxMinLng?: number;
  bboxMaxLat?: number;
  bboxMaxLng?: number;
  areaSqMeters?: number;
  elevationMeters?: number;
  buildingLevels?: number;
  establishedAt?: string;
  isActive: boolean;
  isVisible: boolean;
  reviewStatus: ReviewStatus;
  reviewReason?: string;
  names: Omit<PlaceName, "id" | "displayOrder">[];
  address?: PlaceAddress;
  contacts?: Omit<PlaceContact, "id">[];
  openingHours?: Omit<PlaceOpeningHour, "id">[];
  attributes?: Omit<PlaceAttribute, "id">[];
  images?: Omit<PlaceImage, "id">[];
  aiValues?: Partial<PlaceAiValues>;
};

/**
 * Partial update — only changed fields sent.
 * Collections (names, contacts, attributes) replace entirely when present.
 */
export type UpdatePlaceRequest = Partial<CreatePlaceRequest>;

/* ──────────────── Response types ──────────────── */

export type PlaceListResponse = {
  data: Place[];
  total: number;
  limit: number;
  offset: number;
};

export type PlaceListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  placeType?: PlaceType;
  reviewStatus?: ReviewStatus;
};
