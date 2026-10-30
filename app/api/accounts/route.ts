import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import {
  ACCOUNT_TYPES,
  ACCOUNT_MIGRATION_REQUIRED,
  isMissingAccountTableError,
} from "@/lib/accounts";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES).optional(),
  currency: z.string().length(3).optional(),
  openingBalance: z.number().finite().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  includeInNetWorth: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * v1 accounts are denominated in the user's preferred currency — a genuinely
 * USD-denominated account needs a second snapshot system (docs/accounts.md,
 * "Deliberate limitations"). Rejecting here beats storing a balance the balance
 * view would silently total in the wrong unit.
 */
const CROSS_CURRENCY_ACCOUNT =
  "Cross-currency accounts aren't supported yet — this account must use your preferred currency.";

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();

    // Balances come from the view, never from a client-side sum over a capped
    // transaction fetch.
    const { data, error } = await supabase
      .from("account_balance")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      if (isMissingAccountTableError(error)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    const rows = data ?? [];
    const sorted = [...rows].sort((a, b) => {
      // Active accounts first, then richest — the order a balances page wants.
      if (Boolean(a.is_archived) !== Boolean(b.is_archived)) {
        return a.is_archived ? 1 : -1;
      }
      return Number(b.balance ?? 0) - Number(a.balance ?? 0);
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, type, currency, openingBalance, icon, color, includeInNetWorth, sortOrder } =
      parsed.data;

    // A settings read failure must not fail the write; the currency check is a
    // guard, not the source of truth.
    const { data: settings } = await supabase
      .from("user")
      .select("preferred_currency")
      .eq("id", userId)
      .maybeSingle();

    const preferred = settings?.preferred_currency ?? null;
    if (currency && preferred && currency.toUpperCase() !== preferred.toUpperCase()) {
      return NextResponse.json({ error: CROSS_CURRENCY_ACCOUNT }, { status: 400 });
    }

    const id = generateId();
    // PostgREST is strict about casing — map every field to its column name.
    const { error: insertError } = await supabase.from("account").insert({
      id,
      name,
      type: type ?? "checking",
      currency: currency ?? preferred ?? "USD",
      opening_balance: openingBalance ?? 0,
      icon: icon ?? "wallet",
      color: color ?? "gray",
      include_in_net_worth: includeInNetWorth ?? true,
      sort_order: sortOrder ?? 0,
      user_id: userId,
    });

    if (insertError) {
      if (isMissingAccountTableError(insertError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Read back through the view so the client always receives a balance.
    const { data, error: readError } = await supabase
      .from("account_balance")
      .select("*")
      .eq("account_id", id)
      .maybeSingle();

    if (readError) {
      if (isMissingAccountTableError(readError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase read error:", readError);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}