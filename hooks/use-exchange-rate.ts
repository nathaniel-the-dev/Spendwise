"use client";

import { useQuery } from "@tanstack/react-query";
import { isForeignCurrency } from "@/lib/fx";

/**
 * Fetches the rate used to snapshot a foreign amount into the user's preferred
 * currency. Only runs when the two currencies actually differ, so single-currency
 * users never trigger a request.
 *
 * Rates are cached client-side for 12h (and persisted by the query persister),
 * which is what makes the offline path work: a previously seen rate is reused
 * rather than blocking entry.
 */

/** Matches the server-side cache window in app/api/exchange-rates/route.ts. */
const RATE_TTL_MS = 12 * 60 * 60 * 1000;

export type ExchangeRate = {
  rate: number;
  from: string;
  to: string;
  /** When the provider last published this rate. */
  fetchedAt: string;
  source: string;
};

async function fetchExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  const res = await fetch(
    `/api/exchange-rates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  if (!res.ok) throw new Error("Couldn't fetch an exchange rate");
  return (await res.json()) as ExchangeRate;
}

export function useExchangeRate(
  from: string | null | undefined,
  to: string | null | undefined
) {
  return useQuery({
    queryKey: ["exchange-rate", (from ?? "").toUpperCase(), (to ?? "").toUpperCase()],
    queryFn: () => fetchExchangeRate(from as string, to as string),
    enabled: isForeignCurrency(from, to),
    staleTime: RATE_TTL_MS,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
