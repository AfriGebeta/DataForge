"use client";

import HtmlContentPage from '@/features/shared/HtmlContentPage';
import { content } from './content';
import { pageConfig } from './config';

export default function GeographicValidationPage() {
  return <HtmlContentPage content={content} pageId={pageConfig.id} />;
}
