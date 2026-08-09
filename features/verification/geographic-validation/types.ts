/**
 * Domain types for geographic-validation — mirrors PlaceForge's
 * data-quality `ValidationFlagResponse` (category=GEOMETRY|HIERARCHY) and
 * the address-admin-level module's chain storage. There is NO
 * anomaly-detection endpoint anywhere in this codebase — PlaceForge only
 * stores flags a worker already raised, and GeoValidate's validation
 * modules are unimplemented stubs. See
 * DataForge/frontend/features/verification/INTEGRATION.md for details on
 * what this page can and can't show today.
 */

export type FlagCategory =
  | "GEOMETRY"
  | "ADDRESS"
  | "NAME"
  | "HIERARCHY"
  | "CONTACT"
  | "FRESHNESS"
  | "CONSISTENCY";
export type FlagSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type ValidationFlag = {
  id: string;
  place_id: number;
  category: FlagCategory;
  severity: FlagSeverity;
  flag_code: string;
  message: string;
  field_name?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  detected_at: string;
  place_source_id?: string;
};

export type GeographicValidationParams = {
  page?: number;
  pageSize?: number;
};

export type GeographicValidationResponse = {
  data: ValidationFlag[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminLevelChainItem = {
  id: string;
  addressId: string;
  level: number; // 0=country, 1=region, 2=zone, 3=city, 4=kebele, 5=neighborhood
  code?: string;
  name: Record<string, string>;
};
