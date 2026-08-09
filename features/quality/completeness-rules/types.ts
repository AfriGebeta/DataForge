// Full backend enum (PlaceForge place/api/v1/model.go's placeType validator) —
// completeness rules can target any of these, not just the 5 originally exposed here.
export type PlaceType =
  | "COUNTRY"
  | "PROVINCE"
  | "COUNTY"
  | "MUNICIPALITY"
  | "BOROUGH"
  | "DISTRICT"
  | "VILLAGE"
  | "POSTAL_CODE"
  | "CUSTOM_ZONE"
  | "ROAD"
  | "TRANSIT_LINE"
  | "TRANSIT_STOP"
  | "BUILDING"
  | "NATURAL_FEATURE"
  | "POI";
export type CompletenessLevel = "MINIMAL" | "PARTIAL" | "GOOD" | "COMPLETE";

export type CompletenessRule = {
  id: string;
  place_type: PlaceType;
  required_field: string;
  weight: number;
  level: CompletenessLevel;
  description: string;
};

export type CreateCompletenessRuleRequest = {
  place_type: PlaceType;
  level: CompletenessLevel;
  required_field: string;
  weight: number;
  description: string;
};

export type CompletenessRulesParams = {
  page?: number;
  pageSize?: number;
  place_type?: PlaceType;
  level?: CompletenessLevel;
};

export type CompletenessRulesResponse = {
  data: CompletenessRule[];
  total: number;
};