export type FlagCategory = "GEOMETRY" | "ADDRESS" | "NAME" | "HIERARCHY" | "CONTACT" | "FRESHNESS" | "CONSISTENCY";
export type FlagSeverity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";
export type FlagStatusFilter = "unresolved" | "all" | "resolved";

export type ValidationFlag = {
  id: string;
  place_id: string;
  category: FlagCategory;
  severity: FlagSeverity;
  flag_code: string;
  message: string;
  is_resolved: boolean;
};

export type FlagStats = {
  critical: number;
  error: number;
  warning: number;
  info: number;
};

export type CreateFlagRequest = {
  place_id: string;
  category: FlagCategory;
  severity: FlagSeverity;
  flag_code: string;
  message: string;
};

export type BulkResolveRequest = {
  place_id: string;
  category?: FlagCategory;
  resolved_by: string;
};

export type ValidationFlagsParams = {
  category?: FlagCategory;
  severity?: FlagSeverity;
  status?: FlagStatusFilter;
};

export type ValidationFlagsResponse = {
  data: ValidationFlag[];
  stats: FlagStats;
  total: number;
};