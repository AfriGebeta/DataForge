"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState(buildInitialOpenState);

  useEffect(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => pathname === item.path)
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
              const isGroupOpen = openGroups[group.title];
              return (
                <div
                  key={group.title}
                  className={`nav-group${isGroupOpen ? " open" : ""}`}
                >
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
                      const href = item.path;
                      const isActive = pathname === href;
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className={`nav-item${isActive ? " active" : ""}`}
                          onClick={handleNav}
                        >
                          <i className={`ti ${item.icon}`} />
                          <span className="nav-item-label">{item.label}</span>
                        </Link>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-footer">
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
      </aside>
    </>
  );
}