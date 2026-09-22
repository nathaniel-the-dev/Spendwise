"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readOutbox,
  removeFromOutbox,
  OUTBOX_EVENT,
  type OutboxTransaction,
} from "@/lib/outbox";

/**
 * The current user's queued offline writes, kept live via the OUTBOX_EVENT
 * broadcast (fired on every enqueue/replay/clear).
 */
export function useOutbox(userId: string | undefined): {
  items: OutboxTransaction[];
  discard: (id: string) => Promise<void>;
} {
  const [items, setItems] = useState<OutboxTransaction[]>([]);

  const refresh = useCallback(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    readOutbox(userId).then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const cancel = refresh();
    window.addEventListener(OUTBOX_EVENT, refresh);
    return () => {
      cancel?.();
      window.removeEventListener(OUTBOX_EVENT, refresh);
    };
  }, [refresh]);

  const discard = useCallback(
    async (id: string) => {
      if (!userId) return;
      await removeFromOutbox(userId, id);
    },
    [userId]
  );

  return { items, discard };
}
