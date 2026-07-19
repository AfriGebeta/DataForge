export type PlaceType = "POI" | "ROAD" | "BUILDING" | "MUNICIPALITY" | "TRANSIT_STOP";
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