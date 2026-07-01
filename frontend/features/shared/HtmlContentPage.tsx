"use client";

import { useEffect, useRef } from "react";

type HtmlContentPageProps = {
  content: string;
  pageId: string;
};

export default function HtmlContentPage({ content, pageId }: HtmlContentPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div ref={containerRef} className="view active" id={`v-${pageId}`} />
  );
}
