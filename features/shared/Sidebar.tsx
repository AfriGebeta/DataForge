"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { navGroups } from "./nav";
import type { FeatureNavGroup } from "./types";

type SidebarProps = {
  activeView: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

function getDefaultOpen(group: FeatureNavGroup, activeView: string): boolean {
  return (
    Boolean(group.defaultOpen) ||
    group.items.some((item) => item.id === activeView)
  );
}

export default function Sidebar({
  activeView,
  onNavigate,
  isOpen,
  onClose,
}: SidebarProps) {
  // Only records groups the user has explicitly toggled. Anything not in
  // here falls back to the derived default (open if it's marked
  // `defaultOpen` or contains the active view). This keeps the open/closed
  // state a pure function of props + explicit user action, so a manual
  // collapse always sticks instead of being forced back open.
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>(
    {},
  );

  const toggleGroup = useCallback(
    (group: FeatureNavGroup) => {
      setGroupOverrides((prev) => {
        const currentlyOpen =
          prev[group.title] ?? getDefaultOpen(group, activeView);
        return { ...prev, [group.title]: !currentlyOpen };
      });
    },
    [activeView],
  );

  const handleNav = useCallback(
    (id: string) => {
      onNavigate(id);
      if (window.matchMedia("(max-width: 768px)").matches) {
        onClose();
      }
    },
    [onNavigate, onClose],
  );

  return (
    <>
      <div
        className={`sidebar-backdrop${isOpen ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <div className="logo-icon">
              <Image
                src="/image.png"
                alt="Gebeta Maps"
                width={32}
                height={32}
                className="logo-image"
                priority
              />
            </div>
            <div className="logo-text">
              <span className="logo-name">GebetaMaps</span>
              <span className="logo-sub">Cartographic Intel</span>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-nav-inner">
            {navGroups.map((group) => {
              const isGroupOpen =
                groupOverrides[group.title] ??
                getDefaultOpen(group, activeView);

              return (
                <div
                  key={group.title}
                  className={`nav-group${isGroupOpen ? " open" : ""}`}
                >
                  <button
                    type="button"
                    className="nav-section"
                    aria-expanded={isGroupOpen}
                    onClick={() => toggleGroup(group)}
                  >
                    {group.title}
                    <i className="ti ti-chevron-down nav-chevron" />
                  </button>
                  {isGroupOpen &&
                    group.items.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className={`nav-item${activeView === item.id ? " active" : ""}`}
                        onClick={() => handleNav(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNav(item.id);
                          }
                        }}
                      >
                        <i className={`ti ${item.icon}`} />
                        <span className="nav-item-label">{item.label}</span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
