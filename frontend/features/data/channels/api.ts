import type { ChannelsParams, ChannelsResponse } from './types';

/** Planned endpoint: /api/data/channels */
export const API_ENDPOINT = '/api/data/channels' as const;

export async function fetchChannels(
  _params?: ChannelsParams,
): Promise<ChannelsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
