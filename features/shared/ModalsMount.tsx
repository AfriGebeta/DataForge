"use client";

import { useEffect, useRef } from "react";
import { modalsHtml } from "./modals";

export default function ModalsMount() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (ref.current && !mounted.current) {
      ref.current.innerHTML = modalsHtml;
      mounted.current = true;
    }
  }, []);

  return <div ref={ref} />;
}
