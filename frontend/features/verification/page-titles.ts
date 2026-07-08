import { pageConfig as VerificationQueueConfig } from './verification-queue/config';
import { pageConfig as DuplicateDetectionConfig } from './duplicate-detection/config';
import { pageConfig as GeographicValidationConfig } from './geographic-validation/config';
import { pageConfig as HumanReviewConfig } from './human-review/config';
export const pageTitles = {
  [VerificationQueueConfig.path]: VerificationQueueConfig.title,
  [DuplicateDetectionConfig.path]: DuplicateDetectionConfig.title,
  [GeographicValidationConfig.path]: GeographicValidationConfig.title,
  [HumanReviewConfig.path]: HumanReviewConfig.title,
} as const;
