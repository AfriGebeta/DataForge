"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function findActionTarget(start: HTMLElement, root: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = start;
  while (el && el !== root) {
    if (
      el.dataset.toast ||
      el.dataset.open ||
      el.dataset.close ||
      el.dataset.closeOverlay
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2600);
  }, []);

  const openModal = useCallback((id: string) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
  }, []);

  const closeModal = useCallback((id: string) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
  }, []);

  const filterIng = useCallback((status: string) => {
    document.querySelectorAll("#ing-tb tr").forEach((row) => {
      const element = row as HTMLElement;
      element.style.display =
        !status || element.dataset.st === status ? "" : "none";
    });
  }, []);

  const toggleSchedule = useCallback(() => {
    const sched = document.getElementById("sched") as HTMLSelectElement | null;
    if (!sched) return;
    const value = sched.value;
    const intervalField = document.getElementById("si");
    const cronField = document.getElementById("sc");
    if (intervalField) {
      intervalField.style.display = value === "INTERVAL" ? "block" : "none";
    }
    if (cronField) {
      cronField.style.display = value === "CRON" ? "block" : "none";
    }
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;

      if (target.dataset.closeOverlay && target === event.currentTarget) {
        closeModal(target.dataset.closeOverlay);
        return;
      }

      const actionEl = findActionTarget(target, main);
      if (!actionEl) return;

      if (actionEl.dataset.closeOverlay && target === actionEl) {
        closeModal(actionEl.dataset.closeOverlay);
        return;
      }

      if (actionEl.dataset.open) openModal(actionEl.dataset.open);
      if (actionEl.dataset.close) closeModal(actionEl.dataset.close);
      if (actionEl.dataset.toast) showToast(actionEl.dataset.toast);
    };

    const handleChange = (event: Event) => {
      const el = event.target as HTMLElement;
      if (el.dataset.filterIng !== undefined) {
        filterIng((el as HTMLSelectElement).value);
      }
      if (el.dataset.tglSched !== undefined) {
        toggleSchedule();
      }
    };

    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement;
      if (img.dataset.imgFallback !== undefined) {
        img.style.display = "none";
      }
    };

    main.addEventListener("click", handleClick);
    main.addEventListener("change", handleChange);
    main.addEventListener("error", handleImageError, true);

    return () => {
      main.removeEventListener("click", handleClick);
      main.removeEventListener("change", handleChange);
      main.removeEventListener("error", handleImageError, true);
    };
  }, [closeModal, filterIng, openModal, showToast, toggleSchedule]);

  return (
    <>
      <div className={`shell${sidebarOpen ? " sidebar-open" : ""}`}>
        <Sidebar
          pathname={pathname}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="main" ref={mainRef}>
          <Topbar
            pathname={pathname}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
          />
          <div className="content">
            {children}
          </div>
        </div>
      </div>

      <div className="toast" style={{ opacity: toastVisible ? 1 : 0 }}>
        <i className="ti ti-check" style={{ color: "var(--text-success)" }} />
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
