import { categoryConfig } from './config';
import { pageConfig as VerificationQueueConfig } from './verification-queue/config';
import { pageConfig as GeographicValidationConfig } from './geographic-validation/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  VerificationQueueConfig,
  GeographicValidationConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
