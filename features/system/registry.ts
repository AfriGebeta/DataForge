import type { ComponentType } from 'react';
import AuditLogsPage from './audit-logs';
import SettingsPage from './settings';
import UsersPage from './users';

export const pages = {
  'audit-logs': AuditLogsPage,
  'settings': SettingsPage,
  'users': UsersPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
