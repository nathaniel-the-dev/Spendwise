"use client";

import { useEffect } from "react";

/**
 * Registers the SpendWise service worker (app/sw.js → /sw.js) once, on first
 * client mount, in every environment except during SSR. Registration is
 * fire-and-forget: a failed SW install must never surface as an app error.
 *
 * Rendered inside <Providers> so it mounts exactly once for the whole tree.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // In dev, skip — Next's HMR + the SW cache would fight each other.
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* ignore — offline support is progressive enhancement */
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
