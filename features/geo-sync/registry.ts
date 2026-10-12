import type { ComponentType } from 'react';
import GeocodingSyncPage from './geocoding-sync';

export const pages = {
  'geocoding-sync': GeocodingSyncPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
