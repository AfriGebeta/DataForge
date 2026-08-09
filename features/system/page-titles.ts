import { pageConfig as AuditLogsConfig } from './audit-logs/config';
import { pageConfig as SettingsConfig } from './settings/config';
import { pageConfig as UsersConfig } from './users/config';

export const pageTitles = {
  [AuditLogsConfig.path]: AuditLogsConfig.title,
  [SettingsConfig.path]: SettingsConfig.title,
  [UsersConfig.path]: UsersConfig.title,
} as const;
