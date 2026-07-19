import type { ComponentType } from 'react';
import OverviewDashboardPage from './overview-dashboard';

export const pages = {
  'overview': OverviewDashboardPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
