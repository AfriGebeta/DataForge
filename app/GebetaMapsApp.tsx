"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ModalsMount from "@/features/shared/ModalsMount";
import Sidebar from "@/features/shared/Sidebar";
import Topbar from "@/features/shared/Topbar";
import ViewContent from "@/features/shared/ViewContent";

function findActionTarget(
  start: HTMLElement,
  root: HTMLElement,
): HTMLElement | null {
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

export default function GebetaMapsApp() {
  const [activeView, setActiveView] = useState("overview");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  // Start "open" to match the server-rendered markup (avoids a hydration
  // class mismatch that leaves the DOM stuck with `sidebar-open`), then
  // sync to the real viewport after mount and on breakpoint changes.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setSidebarOpen(!mq.matches);
    const handleChange = (event: MediaQueryListEvent) => {
      setSidebarOpen(!event.matches);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
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

  const navigate = useCallback((id: string) => {
    setActiveView(id);
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

      if (actionEl.dataset.open) {
        openModal(actionEl.dataset.open);
      }

      if (actionEl.dataset.close) {
        closeModal(actionEl.dataset.close);
      }

      if (actionEl.dataset.toast) {
        showToast(actionEl.dataset.toast);
      }
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

    document.querySelectorAll("[data-close-overlay]").forEach((overlay) => {
      overlay.addEventListener("click", handleClick);
    });

    return () => {
      main.removeEventListener("click", handleClick);
      main.removeEventListener("change", handleChange);
      main.removeEventListener("error", handleImageError, true);
      document.querySelectorAll("[data-close-overlay]").forEach((overlay) => {
        overlay.removeEventListener("click", handleClick);
      });
    };
  }, [closeModal, filterIng, openModal, showToast, toggleSchedule]);

  return (
    <>
      <div className={`shell${sidebarOpen ? " sidebar-open" : ""}`}>
        <Sidebar
          activeView={activeView}
          onNavigate={navigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="main" ref={mainRef}>
          <Topbar
            activeView={activeView}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
          />
          <ViewContent activeView={activeView} />
        </div>
      </div>

      <ModalsMount />

      <div className="toast" style={{ opacity: toastVisible ? 1 : 0 }}>
        <i className="ti ti-check" style={{ color: "var(--text-success)" }} />
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
