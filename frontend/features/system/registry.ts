import type { ComponentType } from 'react';
import AuditLogsPage from './audit-logs';
import SettingsPage from './settings';

export const pages = {
  'audit-logs': AuditLogsPage,
  'settings': SettingsPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
