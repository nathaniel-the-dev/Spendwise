import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext, handleError } from "@/lib/api-utils";

/**
 * Exchange rates for converting a foreign amount into the user's preferred
 * currency at entry time. The resolved rate is snapshotted onto the row
 * (see lib/fx.ts), so this endpoint is only ever consulted while a form is
 * being filled in — never during rendering or aggregation.
 *
 * Source: open.er-api.com — free, keyless, and (unlike ECB/Frankfurter)
 * carries currencies such as JMD.
 */

export const dynamic = "force-dynamic";

const RATE_TTL_MS = 12 * 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 6000;

const querySchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
});

type CachedRate = { rate: number; fetchedAt: string };
type ProviderResponse = {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_unix?: number;
};

/** Process-local cache: one upstream call per currency pair per 12h. */
const cache = new Map<string, CachedRate>();

export async function GET(request: Request) {
  try {
    await getAuthContext();

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      from: (url.searchParams.get("from") ?? "").toUpperCase(),
      to: (url.searchParams.get("to") ?? "").toUpperCase(),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { from, to } = parsed.data;

    if (from === to) {
      return NextResponse.json({
        rate: 1,
        from,
        to,
        fetchedAt: new Date().toISOString(),
        source: "identity",
      });
    }

    const key = `${from}:${to}`;
    const cached = cache.get(key);
    if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < RATE_TTL_MS) {
      return NextResponse.json({ ...cached, from, to, source: "cache" });
    }

    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Exchange-rate provider error:", res.status);
      return NextResponse.json({ error: "Rate provider unavailable" }, { status: 502 });
    }

    const payload = (await res.json()) as ProviderResponse;
    const rate = payload.rates?.[to];

    if (payload.result !== "success" || typeof rate !== "number" || rate <= 0) {
      return NextResponse.json(
        { error: `No rate available for ${from} to ${to}` },
        { status: 404 }
      );
    }

    const entry: CachedRate = {
      rate,
      fetchedAt: new Date((payload.time_last_update_unix ?? Date.now() / 1000) * 1000).toISOString(),
    };
    cache.set(key, entry);

    return NextResponse.json({ ...entry, from, to, source: "provider" });
  } catch (error) {
    return handleError(error);
  }
}
