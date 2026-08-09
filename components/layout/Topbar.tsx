"use client";

import { useRouter } from "next/navigation";
import { pageTitles } from "@/features/shared/page-titles";

type TopbarProps = {
  pathname: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export default function Topbar({
  pathname,
  sidebarOpen,
  onToggleSidebar,
}: TopbarProps) {
  const router = useRouter();

  // Convert pathname to page title
  // e.g. "/data/channels" -> look up in pageTitles
  const pageTitle = pageTitles[pathname] ?? pathname;

  return (
    <div className="topbar">
      <button
        type="button"
        className="btn ghost sm sidebar-toggle"
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        <i className={`ti ${sidebarOpen ? "ti-x" : "ti-menu-2"}`} />
      </button>
      <span className="topbar-title">{pageTitle}</span>
      <div className="topbar-search">
        <i className="ti ti-search" />
        <input type="text" placeholder="Search coordinates, IDs, places…" />
      </div>
      <div className="topbar-actions">
        <div className="topbar-avatar" title="Admin">AD</div>
        <button
          type="button"
          className="btn ghost sm topbar-icon-btn"
          onClick={() => {
            document.cookie = "gebeta_token=; path=/; max-age=0";
            router.push("/login");
          }}
          aria-label="Sign out"
          title="Sign out"
        >
          <i className="ti ti-logout" />
        </button>
      </div>
    </div>
  );
}