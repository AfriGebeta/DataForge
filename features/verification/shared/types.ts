/**
 * Shared types for the place-detail/edit page used by verification-queue
 * and geographic-validation. Mirrors PlaceForge's `place` module (camelCase
 * JSON) plus the bits of `data-quality`/`address-admin-level` (snake_case /
 * camelCase respectively) the detail page also touches.
 *
 * Full field list matches PlaceResponse/UpdatePlaceRequest exactly (see
 * PlaceForge/src/modules/place/api/v1/model.go) — this is meant to be a
 * complete editor, not a lean subset.
 */

export type ReviewStatus = "COMPLETED" | "NEEDS_REVIEW";
export type AIDecision = "VALID" | "INVALID" | "AMBIGUOUS" | "DUPLICATE";

export const PLACE_TYPES = [
  "COUNTRY", "PROVINCE", "COUNTY", "MUNICIPALITY", "BOROUGH", "DISTRICT",
  "VILLAGE", "POSTAL_CODE", "CUSTOM_ZONE", "ROAD", "TRANSIT_LINE",
  "TRANSIT_STOP", "BUILDING", "NATURAL_FEATURE", "POI",
] as const;

export const ACCESS_TYPES = [
  "PUBLIC", "PRIVATE", "RESTRICTED", "EMPLOYEE_ONLY", "RESIDENTS_ONLY", "MILITARY",
] as const;

export const GEOCODE_METHODS = [
  "MANUAL", "INTERPOLATION", "ROOFTOP", "ROOF_TOP", "RANGE_INTERPOLATION",
  "POINT_ADDRESS", "COARSE",
] as const;

export const COMPLETENESS_LEVELS = ["MINIMAL", "PARTIAL", "GOOD", "COMPLETE"] as const;

export const CONTACT_TYPES = [
  "PHONE", "MOBILE", "WHATSAPP", "TELEGRAM", "EMAIL", "WEBSITE", "FAX",
  "FACEBOOK", "INSTAGRAM", "TWITTER", "TIKTOK", "LINKEDIN", "YOUTUBE", "SNAPCHAT",
] as const;

export const ATTRIBUTE_VALUE_TYPES = [
  "STRING", "NUMBER", "BOOLEAN", "JSON", "URL", "DATETIME", "ARRAY",
] as const;

export const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export type PlaceName = {
  languageCode: string;
  name: string;
  nameType: string;
  isPrimary: boolean;
};

export type AIValues = {
  aiGeoValid?: boolean;
  aiGeoScore?: number;
  aiNameValid?: boolean;
  aiNameScore?: number;
  aiDuplicateScore?: number;
  aiMlConfidence?: number;
  aiOverallScore?: number;
  aiDecision?: AIDecision;
  aiReasons?: Record<string, unknown>;
  aiValidatedAt?: string;
};

export type AddressDetail = {
  id: string;
  countryIso2: string;
  countryIso3?: string;
  streetName?: Record<string, string>;
  streetNumber?: string;
  blockNumber?: string;
  buildingNumber?: string;
  unitNumber?: string;
  floorNumber?: string;
  postcode?: string;
  postBox?: string;
  formattedFull?: Record<string, string>;
  formattedShort?: Record<string, string>;
  landmarkDescription?: string;
  woredaNumber?: string;
  kebeleNumber?: string;
  isVerified: boolean;
};

export type ContactPoint = {
  id: string;
  type: string;
  value: string;
  label?: string;
  verified: boolean;
};

export type OpeningHour = {
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  label?: string;
};

export type Attribute = {
  id: string;
  key: string;
  value: unknown;
  valueType: string;
  isPrimary: boolean;
};

export type PlaceImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  blurhash?: string;
};

export type PlaceDetail = {
  id: number;
  placeType: string;
  accessType: string;
  categoryId?: string;
  latitude: number;
  longitude: number;
  geometryType?: string;
  geocodeConfidence?: number;
  geocodeMethod?: string;
  areaSqMeters?: number;
  elevationMeters?: number;
  buildingLevels?: number;
  establishedAt?: string;
  dateClosed?: string;
  isActive: boolean;
  isVisible: boolean;
  reviewStatus: ReviewStatus;
  reviewReason?: string;
  completenessScore: number;
  completenessLevel: string;
  placeRank: number;
  displayRank: number;
  minZoom: number;
  maxZoom: number;
  osmRank?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  refreshedAt?: string;
  names: PlaceName[];
  address?: AddressDetail;
  contacts?: ContactPoint[];
  openingHours?: OpeningHour[];
  attributes?: Attribute[];
  images?: PlaceImage[];
  aiValues?: AIValues;
};

export type UpdateAddressPayload = {
  countryIso2: string;
  countryIso3?: string;
  streetName?: Record<string, string>;
  streetNumber?: string;
  blockNumber?: string;
  buildingNumber?: string;
  unitNumber?: string;
  floorNumber?: string;
  postcode?: string;
  postBox?: string;
  formattedFull?: Record<string, string>;
  formattedShort?: Record<string, string>;
  landmarkDescription?: string;
  woredaNumber?: string;
  kebeleNumber?: string;
  isVerified?: boolean;
};

export type UpdateContactPayload = { type: string; value: string; label?: string };
export type UpdateOpeningHourPayload = {
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  label?: string;
};
export type UpdateAttributePayload = { key: string; value: unknown; valueType: string };
export type UpdateImagePayload = { url: string; isPrimary: boolean; blurhash?: string };

export type UpdatePlacePayload = {
  placeType?: string;
  accessType?: string;
  categoryId?: string | null;
  latitude?: number;
  longitude?: number;
  geocodeConfidence?: number;
  geocodeMethod?: string;
  areaSqMeters?: number;
  elevationMeters?: number;
  buildingLevels?: number;
  establishedAt?: string;
  dateClosed?: string;
  isActive?: boolean;
  isVisible?: boolean;
  reviewReason?: string;
  completenessLevel?: string;
  placeRank?: number;
  displayRank?: number;
  minZoom?: number;
  maxZoom?: number;
  osmRank?: number;
  names?: Record<string, string>;
  address?: UpdateAddressPayload;
  contacts?: UpdateContactPayload[];
  openingHours?: UpdateOpeningHourPayload[];
  attributes?: UpdateAttributePayload[];
  images?: UpdateImagePayload[];
};

export type ReviewDecision = "approve" | "reject";

export type AdminLevelChainItem = {
  id: string;
  addressId: string;
  level: number; // 0=country, 1=region, 2=zone, 3=city, 4=kebele, 5=neighborhood
  code?: string;
  name: Record<string, string>;
};

export type AdminLevelInput = {
  level: number;
  code?: string;
  name: Record<string, string>;
};

// Mirrors data-quality's ValidationFlagResponse (snake_case).
export type PlaceFlag = {
  id: string;
  place_id: number;
  category: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  flag_code: string;
  message: string;
  field_name?: string;
  is_resolved: boolean;
  detected_at: string;
};
