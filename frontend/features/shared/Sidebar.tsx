"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { navGroups } from "./nav";

type SidebarProps = {
  activeView: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

function buildInitialOpenState(): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  navGroups.forEach((group) => {
    initial[group.title] = group.defaultOpen ?? false;
  });
  return initial;
}

export default function Sidebar({
  activeView,
  onNavigate,
  isOpen,
  onClose,
}: SidebarProps) {
  const [openGroups, setOpenGroups] = useState(buildInitialOpenState);

  useEffect(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => item.id === activeView),
    );
    if (group) {
      setOpenGroups((prev) => ({ ...prev, [group.title]: true }));
    }
  }, [activeView]);

  const toggleGroup = useCallback((title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

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
        <div className="logo">
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

        {navGroups.map((group) => {
          const isOpen = openGroups[group.title];

          return (
            <div key={group.title} className={`nav-group${isOpen ? " open" : ""}`}>
              <button
                type="button"
                className="nav-section"
                aria-expanded={isOpen}
                onClick={() => toggleGroup(group.title)}
              >
                {group.title}
                <i className="ti ti-chevron-down nav-chevron" />
              </button>
              {isOpen &&
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
                    {item.label}
                  </div>
                ))}
            </div>
          );
        })}
      </aside>
    </>
  );
}
