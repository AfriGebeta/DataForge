import type { GeographicValidationParams, GeographicValidationResponse } from './types';

/** Planned endpoint: /api/verification/geo */
export const API_ENDPOINT = '/api/verification/geo' as const;

export async function fetchGeographicValidation(
  _params?: GeographicValidationParams,
): Promise<GeographicValidationResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
