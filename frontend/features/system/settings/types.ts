/** Domain types for settings — align with backend contracts. */

export type SettingsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type SettingsResponse = {
  items: unknown[];
  total: number;
};
