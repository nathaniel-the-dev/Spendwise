import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import { OfflineRetryButton } from "@/components/shared/offline-retry-button";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/**
 * Offline fallback, precached by the service worker. Rendered when a page
 * navigation can't be served from cache with no connection. Deliberately
 * dependency-light: no data fetching, no web fonts beyond the system stack,
 * nothing that itself needs the network — its only job is to explain the
 * situation honestly and let the user retry.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CloudOff className="h-7 w-7 text-primary" aria-hidden="true" />
      </span>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        You&rsquo;re offline
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        SpendWise couldn&rsquo;t reach the network. If you were viewing your
        dashboard before, your most recent data is still available — reconnect
        to refresh it and sync any changes you made.
      </p>
      <OfflineRetryButton />
    </div>
  );
}
