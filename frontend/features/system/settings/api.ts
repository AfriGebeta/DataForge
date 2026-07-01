import type { SettingsParams, SettingsResponse } from './types';

/** Planned endpoint: /api/system/settings */
export const API_ENDPOINT = '/api/system/settings' as const;

export async function fetchSettings(
  _params?: SettingsParams,
): Promise<SettingsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
