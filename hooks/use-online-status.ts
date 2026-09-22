"use client";

import { useEffect, useState } from "react";

/**
 * Live browser connectivity: initial value from navigator.onLine, kept fresh
 * via the window online/offline events. NOTE: "online" only means the OS has
 * a network interface — requests can still fail (captive portals, dead
 * sessions). Callers treat fetch TypeErrors as offline too.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
