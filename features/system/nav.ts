import { categoryConfig } from './config';
import { pageConfig as AuditLogsConfig } from './audit-logs/config';
import { pageConfig as SettingsConfig } from './settings/config';
import { pageConfig as UsersConfig } from './users/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  AuditLogsConfig,
  SettingsConfig,
  UsersConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
