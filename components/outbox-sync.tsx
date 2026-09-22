"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/components/supabase-provider";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useOutbox } from "@/hooks/use-outbox";
import { readOutbox, removeFromOutbox } from "@/lib/outbox";
import { isOfflineError } from "@/lib/api-error";

/**
 * Replays queued offline transaction creates once the browser is back online.
 * Mounted once inside <Providers>; renders nothing.
 *
 * Drains whenever (online AND queue non-empty) changes — not just on the
 * `online` event — so it also catches items enqueued during a transient
 * failure where navigator.onLine never flipped (captive portals, momentary
 * drops). Entries are processed oldest-first and removed only on a confirmed
 * 2xx, so a still-flaky network leaves them queued for the next attempt. A
 * genuine API rejection (4xx/5xx) is dropped with a toast; keeping it would
 * block the queue forever.
 */
export function OutboxSync() {
  const { user } = useUser();
  const online = useOnlineStatus();
  const { items } = useOutbox(user?.id);
  const qc = useQueryClient();
  const running = useRef(false);

  const userId = user?.id;
  const count = items.length;

  useEffect(() => {
    if (!online || !userId || count === 0) return;

    let cancelled = false;

    async function drain(uid: string) {
      if (running.current) return;
      running.current = true;
      let synced = 0;
      let dropped = false;
      try {
        // Loop until the queue settles: each pass re-reads the outbox so a
        // concurrent enqueue (a new offline save landing mid-drain) is picked
        // up rather than stranded until the next trigger.
        for (;;) {
          if (cancelled) break;
          const pending = await readOutbox(uid);
          if (pending.length === 0) break;

          let progressed = false;
          for (const item of pending) {
            if (cancelled) break;
            try {
              const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item.payload),
              });
              if (res.ok) {
                await removeFromOutbox(uid, item.id);
                synced++;
                progressed = true;
              } else {
                // Real API rejection — not worth retrying; drop + report.
                await removeFromOutbox(uid, item.id);
                dropped = true;
                progressed = true;
              }
            } catch (err) {
              if (isOfflineError(err)) break; // still offline; keep queued
              await removeFromOutbox(uid, item.id);
              dropped = true;
              progressed = true;
            }
          }
          // No item advanced the queue this pass (still offline) → stop.
          if (!progressed) break;
        }
      } finally {
        running.current = false;
      }

      if (cancelled) return;
      if (dropped) {
        toast.error("An offline transaction couldn't be saved", {
          description: "It was dropped — please add it again.",
        });
      }
      if (synced > 0) {
        // removeFromOutbox already emits OUTBOX_EVENT (refreshes pending rows);
        // here we just pull the now-persisted rows from the server.
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["transactions-page"] });
        toast.success(
          synced === 1 ? "Offline transaction synced" : `${synced} offline transactions synced`
        );
      }
    }

    drain(userId);
    return () => {
      cancelled = true;
    };
  }, [online, userId, count, qc]);

  return null;
}
