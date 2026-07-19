import { pageConfig as AuditLogsConfig } from './audit-logs/config';
import { pageConfig as SettingsConfig } from './settings/config';
export const pageTitles = {
  [AuditLogsConfig.path]: AuditLogsConfig.title,
  [SettingsConfig.path]: SettingsConfig.title,
} as const;
