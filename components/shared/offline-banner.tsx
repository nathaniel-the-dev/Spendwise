"use client";

import { useEffect, useRef, useState } from "react";
import { CloudOff, Cloud, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useOutbox } from "@/hooks/use-outbox";
import { useUser } from "@/components/supabase-provider";
import { cn } from "@/lib/utils";

/**
 * Persistent offline strip for the dashboard shell. Communicates the two
 * things that matter when the network is down: you're looking at cached data,
 * and anything you add is queued (with the live count) rather than lost.
 * When back online with an empty queue it quietly disappears; right after a
 * reconnect it shows the sync state for a moment.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const { user } = useUser();
  const { items } = useOutbox(user?.id);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOffline = useRef(!online);

  // Flash "Back online — syncing…" briefly, but ONLY on a real offline→online
  // transition — not on the initial mount of an already-online session.
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setJustReconnected(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setJustReconnected(true);
    const t = setTimeout(() => setJustReconnected(false), 4000);
    return () => clearTimeout(t);
  }, [online]);

  if (online && items.length === 0 && !justReconnected) return null;

  const pending = items.length;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 border-b px-4 py-1.5 text-xs font-medium transition-colors",
        !online
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-primary/20 bg-primary/5 text-primary"
      )}
    >
      {!online ? (
        <>
          <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            You're offline — showing saved data
            {pending > 0 && (
              <>
                ; <strong className="font-semibold">{pending}</strong>{" "}
                {pending === 1 ? "change is" : "changes are"} waiting to sync
              </>
            )}
          </span>
        </>
      ) : pending > 0 ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          <span>
            Back online — syncing {pending} {pending === 1 ? "change" : "changes"}…
          </span>
        </>
      ) : (
        <>
          <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Back online — everything synced</span>
        </>
      )}
    </div>
  );
}
