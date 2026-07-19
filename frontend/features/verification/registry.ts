import type { ComponentType } from 'react';
import VerificationQueuePage from './verification-queue';
import DuplicateDetectionPage from './duplicate-detection';
import GeographicValidationPage from './geographic-validation';
import HumanReviewPage from './human-review';

export const pages = {
  'verification-queue': VerificationQueuePage,
  'duplicate-detection': DuplicateDetectionPage,
  'geo-validation': GeographicValidationPage,
  'human-review': HumanReviewPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
