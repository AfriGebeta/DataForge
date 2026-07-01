import { pageConfig as AuditLogsConfig } from './audit-logs/config';
import { pageConfig as SettingsConfig } from './settings/config';

export const pageTitles = {
  'audit-logs': AuditLogsConfig.title,
  'settings': SettingsConfig.title,
} as const;
