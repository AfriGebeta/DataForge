import { categoryConfig } from './config';
import { pageConfig as VerificationQueueConfig } from './verification-queue/config';
import { pageConfig as DuplicateDetectionConfig } from './duplicate-detection/config';
import { pageConfig as GeographicValidationConfig } from './geographic-validation/config';
import { pageConfig as HumanReviewConfig } from './human-review/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  VerificationQueueConfig,
  DuplicateDetectionConfig,
  GeographicValidationConfig,
  HumanReviewConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
