"use client";

import HtmlContentPage from '@/features/shared/HtmlContentPage';
import { content } from './content';
import { pageConfig } from './config';

export default function OverviewDashboardPage() {
  return <HtmlContentPage content={content} pageId={pageConfig.id} />;
}
