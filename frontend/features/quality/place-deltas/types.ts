export type DeltaAction = "ADD" | "UPDATE" | "REMOVE";
export type DeltaSourceType = "USER_SUBMISSION" | "OSM" | "PARTNER_IMPORT";
export type DeltaAppliedFilter = "unapplied" | "all" | "applied";

export type PlaceDelta = {
  id: string;
  source_place_id: string;
  target_place_id?: string;
  action: DeltaAction;
  field_name: string;
  source_type: DeltaSourceType;
  after_value: string;
  is_applied: boolean;
};

export type CreatePlaceDeltaRequest = {
  source_place_id: string;
  target_place_id?: string;
  action: DeltaAction;
  field_name: string;
  before_data?: string;
  after_data: string;
};

export type PlaceDeltasParams = {
  action?: DeltaAction;
  applied?: DeltaAppliedFilter;
  source_type?: DeltaSourceType;
};

export type PlaceDeltasResponse = {
  data: PlaceDelta[];
  total: number;
};