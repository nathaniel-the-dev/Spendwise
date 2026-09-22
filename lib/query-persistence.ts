import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import type { Query } from "@tanstack/react-query";

/**
 * Per-user persistence of the TanStack Query cache (offline READS).
 *
 * Entries are keyed by Supabase user id and, on sign-out, the *query cache*
 * is purged while the outbox is preserved — queued writes are user data, not
 * a cache, and deleting them on logout would silently lose them.
 *
 * `buster` invalidates caches written by an older app version; `maxAge` caps
 * how stale restored data may be before it's discarded outright.
 */
export const QUERY_CACHE_BUSTER = "spendwise-v1";
export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

const KEY_PREFIX = "spendwise-query:";

export function createQueryPersister(userId: string): Persister {
  const key = `${KEY_PREFIX}${userId}`;
  return {
    persistClient: async (client: PersistedClient) => {
      localStorage.setItem(key, JSON.stringify(client));
    },
    restoreClient: async () => {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as PersistedClient) : undefined;
    },
    removeClient: async () => {
      localStorage.removeItem(key);
    },
  };
}

/**
 * Only successful reads are worth restoring; errors and in-flight results
 * would hydrate the cache with junk the next online fetch overwrites anyway.
 */
export function shouldDehydrateQuery(query: Query): boolean {
  return query.state.status === "success";
}

/**
 * Sign-out hygiene: drop the persisted query cache for every account on this
 * device. The cache is disposable (it refetches on next login) and purging it
 * keeps a previous user's balances off a shared device's storage.
 *
 * The OUTBOX is deliberately NOT cleared: those are unsynced writes the user
 * made while offline, and deleting them would destroy their data. Outbox
 * entries are keyed by user id and only ever replayed for that same user
 * (see <OutboxSync>), so they can't leak into another account's session.
 */
export async function purgeQueryCache(): Promise<void> {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(KEY_PREFIX)) localStorage.removeItem(k);
  }
}
