// Same enum as System → Users' AdminRole (features/system/users/types.ts) —
// duplicated rather than imported since the two features don't otherwise
// share a dependency, and both mirror the same backend validator.
export type AdminRole =
  | "ADMIN"
  | "DATA_EDITOR"
  | "DATA_REVIEWER"
  | "DATA_VALIDATOR"
  | "VIEWER"
  | "SERVICE_ACCOUNT";

// Backed by PlaceForge's real GET/PUT /settings — every field here maps to
// something this app actually reads and uses, unlike the previous mock
// (anomaly sensitivity / model selection / trust weights / integrations)
// which had no backing system anywhere in this repo.
export type SettingsData = {
  // Days since a place's last refresh before Place → List's "outdated
  // places" stat/filter counts it as stale (was a hardcoded frontend
  // constant — now the single source of truth for that page too).
  staleDaysThreshold: number;
  // Role pre-selected on System → Users' Invite form.
  defaultAdminRole: AdminRole;
  // ISO 639-1 codes GeoValidate treats a place name's script as allowed
  // (see GeoValidate/geovalidator/validation/language.py) — empty means no
  // restriction is enforced, every place passes the language check.
  allowedLanguages: string[];
};