"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { navGroups } from "@/features/shared/nav";

type SidebarProps = {
  pathname: string;
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

export default function Sidebar({ pathname, isOpen, onClose }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState(buildInitialOpenState);

  useEffect(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => pathname === `/${item.id}`)
    );
    if (group) {
      setOpenGroups((prev) => ({ ...prev, [group.title]: true }));
    }
  }, [pathname]);

  const toggleGroup = useCallback((title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const handleNav = useCallback(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      onClose();
    }
  }, [onClose]);

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
          const isGroupOpen = openGroups[group.title];
          return (
            <div key={group.title} className={`nav-group${isGroupOpen ? " open" : ""}`}>
              <button
                type="button"
                className="nav-section"
                aria-expanded={isGroupOpen}
                onClick={() => toggleGroup(group.title)}
              >
                {group.title}
                <i className="ti ti-chevron-down nav-chevron" />
              </button>
              {isGroupOpen &&
                group.items.map((item) => {
  const href = `/${item.id}`;
  const isActive = pathname === href;
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className={`nav-item${isActive ? " active" : ""}`}
                      onClick={handleNav}
                    >
                      <i className={`ti ${item.icon}`} />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </aside>
    </>
  );
}