import { get, set, del, keys, delMany } from "idb-keyval";

/**
 * Offline write queue (outbox).
 *
 * When a transaction create fails because the device is offline, the payload
 * is parked in IndexedDB and replayed by <OutboxSync> once the browser is
 * back online. Deletes/edits are NOT queued — replaying those blind risks
 * destroying or duplicating server state, and the app's delete flow already
 * guards with Undo. Creates are the one operation safe to queue.
 *
 * Replay is a normal POST (the server mints the row id), so the only
 * duplicate window is "POST succeeded but the response was lost before we
 * cleared the entry" — narrow, and recoverable via the existing delete/Undo
 * flow. We deliberately avoid sending a client row id + upsert because that
 * would require UPDATE/SELECT RLS policies the transaction table may not have.
 *
 * Entries are keyed by Supabase user id and flushed on sign-out so one
 * account's pending writes can't replay into another's session.
 */

export type OutboxTransaction = {
  /** Local queue-entry id (not the server row id) — used to remove on replay. */
  id: string;
  userId: string;
  createdAt: number;
  payload: {
    amount: number;
    currency?: string;
    /**
     * FX snapshot captured at entry. Carried through the queue so an offline
     * write replays with the rate the user actually saw, not today's rate.
     */
    fxRate?: number | null;
    fxSource?: "auto" | "manual" | null;
    description: string;
    date: string;
    type?: "expense" | "income";
    categoryId?: string | null;
    tags?: string[];
    notes?: string | null;
  };
};

const KEY_PREFIX = "spendwise-outbox:";
/** Fired on every outbox mutation so mounted hooks can refetch the list. */
export const OUTBOX_EVENT = "spendwise:outbox-changed";

function keyFor(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OUTBOX_EVENT));
  }
}

export async function readOutbox(userId: string): Promise<OutboxTransaction[]> {
  const items = await get<OutboxTransaction[]>(keyFor(userId));
  return Array.isArray(items) ? items : [];
}

async function writeOutbox(userId: string, items: OutboxTransaction[]): Promise<void> {
  await set(keyFor(userId), items);
}

export async function addToOutbox(userId: string, item: OutboxTransaction): Promise<void> {
  const items = await readOutbox(userId);
  items.push(item);
  await writeOutbox(userId, items);
  emit();
}

export async function removeFromOutbox(userId: string, id: string): Promise<void> {
  const items = await readOutbox(userId);
  await writeOutbox(
    userId,
    items.filter((i) => i.id !== id)
  );
  emit();
}

/** Drop everything queued for a user — called on sign-out. */
export async function clearOutbox(userId: string): Promise<void> {
  await del(keyFor(userId));
  emit();
}

/**
 * Nuclear option for sign-out: remove ALL users' outboxes. Used when the
 * signing-out session's user id may no longer be resolvable.
 */
export async function clearAllOutboxes(): Promise<void> {
  const all = await keys();
  await delMany(
    all.filter((k): k is string => typeof k === "string" && k.startsWith(KEY_PREFIX))
  );
  emit();
}
