"use client";

import { useIsRestoring } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

/**
 * Don't mount query-consuming UI until the persisted cache has been hydrated
 * — queries that fire during restore race the hydration and can double-fetch
 * (or briefly overwrite fresher cached state) while offline.
 *
 * Only the dashboard (the sole consumer of cached queries) is wrapped;
 * marketing pages render immediately so their server HTML is never replaced
 * by a spinner. Restore reads localStorage synchronously and resolves in a
 * microtask — the splash is effectively imperceptible.
 */
export function RestoreGate({ children }: { children: React.ReactNode }) {
  const restoring = useIsRestoring();
  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}
