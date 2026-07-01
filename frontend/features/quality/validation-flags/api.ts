import type { ValidationFlagsParams, ValidationFlagsResponse } from './types';

/** Planned endpoint: /api/quality/flags */
export const API_ENDPOINT = '/api/quality/flags' as const;

export async function fetchValidationFlags(
  _params?: ValidationFlagsParams,
): Promise<ValidationFlagsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
