import { pageConfig as VerificationQueueConfig } from './verification-queue/config';
import { pageConfig as DuplicateDetectionConfig } from './duplicate-detection/config';
import { pageConfig as GeographicValidationConfig } from './geographic-validation/config';
import { pageConfig as HumanReviewConfig } from './human-review/config';

export const pageTitles = {
  'verification-queue': VerificationQueueConfig.title,
  'duplicate-detection': DuplicateDetectionConfig.title,
  'geo-validation': GeographicValidationConfig.title,
  'human-review': HumanReviewConfig.title,
} as const;
