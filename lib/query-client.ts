import { QueryClient } from "@tanstack/react-query";

/**
 * Single factory for the app's QueryClient. retry: 1 keeps offline failures
 * snappy — the default (3 retries with backoff) leaves queries spinning for
 * seconds when there's no network at all.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
      },
      // offlineFirst, NOT the default "online".
      //
      // With the default, a mutation whose device is offline is PAUSED in
      // memory: the request is never attempted, so a caller's error path never
      // runs, the user gets no feedback, and the write dies with the tab. Here
      // it must run and fail fast so the caller can park the write in the
      // IndexedDB outbox (see lib/outbox.ts) and tell the user it's saved.
      //
      // Queries deliberately keep the default: a paused query keeps rendering
      // its cached data, whereas an attempted-and-failed one would risk
      // flipping a list page into an error state while offline.
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  });
}
