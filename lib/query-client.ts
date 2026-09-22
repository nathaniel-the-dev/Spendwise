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
    },
  });
}
