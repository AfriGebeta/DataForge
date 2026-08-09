"use client";

import { getPageComponent } from "./page-registry";

type ViewContentProps = {
  activeView: string;
};

export default function ViewContent({ activeView }: ViewContentProps) {
  const Page = getPageComponent(activeView);

  if (!Page) {
    return (
      <div className="content">
        <div className="view active">
          <div className="page-hd">
            <h2>Page not found</h2>
            <p>No view registered for &ldquo;{activeView}&rdquo;.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <Page />
    </div>
  );
}
