import { pageConfig as VerificationQueueConfig } from './verification-queue/config';
import { pageConfig as GeographicValidationConfig } from './geographic-validation/config';
export const pageTitles = {
  [VerificationQueueConfig.path]: VerificationQueueConfig.title,
  [GeographicValidationConfig.path]: GeographicValidationConfig.title,
} as const;
