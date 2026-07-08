"use client";

import { useEffect, useState } from "react";
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
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

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
        <span className="bx s topbar-live">
          <span className="dot da" style={{ marginRight: 3 }} />
          Live
        </span>
        <span className="bx m topbar-clock">{clock}</span>
        <button type="button" className="btn ghost sm topbar-icon-btn">
          <i className="ti ti-bell" />
        </button>
        <button type="button" className="btn ghost sm topbar-icon-btn">
          <i className="ti ti-help" />
        </button>
        <button
          type="button"
          className="btn sm topbar-support"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Support
        </button>
        <button type="button" className="btn p sm topbar-deploy">
          <i className="ti ti-rocket" />
          <span>Deploy</span>
        </button>
        <div className="topbar-avatar">AD</div>
      </div>
    </div>
  );
}