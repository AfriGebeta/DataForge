import type { ComponentType } from 'react';
import VerificationQueuePage from './verification-queue';
import GeographicValidationPage from './geographic-validation';

export const pages = {
  'verification-queue': VerificationQueuePage,
  'geo-validation': GeographicValidationPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
