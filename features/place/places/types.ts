/**
 * Domain types for the Place menu's list/create flow — aligned with
 * PlaceForge's `place` module (see PlaceForge/src/modules/place/api/v1/model.go).
 *
 * Update and deactivate reuse the full-record types/api from
 * features/verification/shared (same backend module, same `PlaceDetail` /
 * `UpdatePlacePayload` shapes) — this file only covers what's unique to
 * listing (the lean `PlaceListItem` the list endpoint actually returns) and
 * creating (`CreatePlaceRequest`).
 */

export type PlaceType =
  | "COUNTRY" | "PROVINCE" | "COUNTY" | "MUNICIPALITY" | "BOROUGH" | "DISTRICT"
  | "VILLAGE" | "POSTAL_CODE" | "CUSTOM_ZONE" | "ROAD" | "TRANSIT_LINE"
  | "TRANSIT_STOP" | "BUILDING" | "NATURAL_FEATURE" | "POI";

export type AccessType = "PUBLIC" | "PRIVATE" | "RESTRICTED" | "EMPLOYEE_ONLY" | "RESIDENTS_ONLY" | "MILITARY";
export type GeometryType = "Point" | "Polygon";
export type ReviewStatus = "COMPLETED" | "NEEDS_REVIEW";
export type AIDecision = "VALID" | "INVALID" | "AMBIGUOUS" | "DUPLICATE";
export type ContactType =
  | "PHONE" | "MOBILE" | "WHATSAPP" | "TELEGRAM" | "EMAIL" | "WEBSITE" | "FAX"
  | "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "LINKEDIN" | "YOUTUBE" | "SNAPCHAT";
export type AttributeValueType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "URL" | "DATETIME" | "ARRAY";

// Mirrors features/data/channels/types.ts's IngestChannelType - duplicated
// rather than imported, same cross-feature convention as ContactType above.
// A place has no source/channel column of its own; PlaceForge resolves this
// by tracing back through the commit chain (place <- parsed_entity.committedPlaceId
// <- parsed_entity.rawIngestId -> raw_ingest.channel/channelId) - see
// PlaceForge's place/repository/main.go ListPlaces for the full comment.
export type IngestChannelType =
  | "TELEGRAM_BOT" | "TELEGRAM_WEBHOOK" | "WHATSAPP_WEBHOOK" | "REST_API" | "BATCH_IMPORT" | "MANUAL";

/* ── List item — GET /places returns this lean shape, not the full record ── */

export type PlaceNameItem = { languageCode: string; name: string; nameType: string; isPrimary: boolean };

export type PlaceListAiValues = {
  aiGeoValid?: boolean | null;
  aiGeoScore?: number | null;
  aiNameValid?: boolean | null;
  aiNameScore?: number | null;
  aiLanguageValid?: boolean | null;
  aiDuplicateScore?: number | null;
  aiMlConfidence?: number | null;
  aiOverallScore?: number | null;
  aiDecision?: AIDecision | null;
  aiReasons?: string[] | null;
  aiValidatedAt?: string | null;
};

export type PlaceListItem = {
  id: number;
  placeType: string;
  categoryId?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isVisible: boolean;
  reviewStatus: string;
  reviewReason?: string;
  completenessLevel: string;
  names: PlaceNameItem[];
  aiValues?: PlaceListAiValues | null;
  createdAt: string;
  refreshedAt?: string;
  /** The channel this place was actually ingested through — see the doc
   * comment above IngestChannelType. Undefined for a hand-created place. */
  sourceChannel?: IngestChannelType;
  sourceChannelId?: string;
  sourceChannelName?: string;
};

export type PlaceListParams = {
  limit?: number;
  offset?: number;
  placeType?: PlaceType;
  categoryId?: string;
  isActive?: boolean;
  isVisible?: boolean;
  reviewStatus?: ReviewStatus;
  aiDecision?: AIDecision;
  /** Restricts to places never refreshed, or not refreshed within this many days. */
  staleDays?: number;
  /** Restricts to places with no categoryId set. */
  missingCategory?: boolean;
  /** Restricts to places whose coordinates were never really set ("Null Island" 0,0). */
  missingCoordinates?: boolean;
  /** Restricts to places committed from a raw_ingest of this channel kind (e.g. Telegram vs REST API). */
  channel?: IngestChannelType;
  /** Restricts to places committed from one specific configured channel instance (raw_ingest.channelId). */
  channelId?: string;
  /** Client-side only — PlaceForge has no server-side name search on GET /places. */
  search?: string;
};

export type PlaceListResponse = {
  data: PlaceListItem[];
  total: number;
  limit: number;
  offset: number;
};

/* ── Create request (POST /places) ── */

export type CreateAddressRequest = {
  countryIso2: string;
  streetName?: Record<string, string>;
  streetNumber?: string;
};

export type CreateContactRequest = { type: ContactType; value: string; label?: string };
export type CreateOpeningHoursRequest = {
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  label?: string;
};
export type CreateAttributeRequest = { key: string; value: unknown; valueType: AttributeValueType };
export type CreateImageRequest = { url: string; isPrimary: boolean; blurhash?: string };

export type CreatePlaceRequest = {
  placeType: PlaceType;
  accessType: AccessType;
  categoryId?: string;
  latitude: number;
  longitude: number;
  geometryType?: GeometryType;
  geocodeConfidence?: number;
  geocodeMethod?: string;
  areaSqMeters?: number;
  elevationMeters?: number;
  buildingLevels?: number;
  establishedAt?: string;
  isActive?: boolean;
  isVisible?: boolean;
  reviewStatus?: ReviewStatus;
  reviewReason?: string;
  /**
   * languageCode -> name text. The backend derives the primary name
   * (en > am > alphabetically-first) and sets nameType=OFFICIAL on every
   * entry automatically — there is no way to set either from the API.
   */
  names: Record<string, string>;
  address?: CreateAddressRequest;
  contacts?: CreateContactRequest[];
  openingHours?: CreateOpeningHoursRequest[];
  attributes?: CreateAttributeRequest[];
  images?: CreateImageRequest[];
  bboxMinLat?: number;
  bboxMinLng?: number;
  bboxMaxLat?: number;
  bboxMaxLng?: number;
  areaCoordinates?: number[][];
};
