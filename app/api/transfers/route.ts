import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { buildFxColumns, FX_MIGRATION_REQUIRED, isMissingFxColumnError } from "@/lib/fx";
import { ACCOUNT_MIGRATION_REQUIRED, isMissingAccountTableError } from "@/lib/accounts";

/**
 * The embed lets the list render account names without a second round trip.
 * Aliases are explicit (`from_account`/`to_account`) because the same
 * `account` relation is reached twice and PostgREST needs them distinguished.
 */
const TRANSFER_SELECT = "*, from_account:from_account_id(*), to_account:to_account_id(*)";

const createSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  date: z.string().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
});

const CROSS_CURRENCY_TRANSFER =
  "Transfers between different currencies aren't supported yet — both accounts must use the same currency.";

export async function GET(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const url = new URL(request.url);
    const fromAccountId = url.searchParams.get("fromAccountId");
    const toAccountId = url.searchParams.get("toAccountId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") ?? "50") || 50, 1),
      200
    );

    let query = supabase
      .from("transfer")
      .select(TRANSFER_SELECT)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fromAccountId) query = query.eq("from_account_id", fromAccountId);
    if (toAccountId) query = query.eq("to_account_id", toAccountId);
    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;

    if (error) {
      if (isMissingAccountTableError(error)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
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

    const { fromAccountId, toAccountId, amount, currency, date, description, notes, fxRate, fxSource } =
      parsed.data;

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: "Pick two different accounts." }, { status: 400 });
    }

    // Verify ownership up front: a raw FK violation would surface as an opaque
    // 500, and the user needs to know which of the two accounts is the problem.
    const { data: accounts, error: accountsError } = await supabase
      .from("account")
      .select("id, currency")
      .in("id", [fromAccountId, toAccountId])
      .eq("user_id", userId);

    if (accountsError) {
      if (isMissingAccountTableError(accountsError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase query error:", accountsError);
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
    }

    if (!accounts || accounts.length !== 2) {
      return NextResponse.json({ error: "One of those accounts isn't yours." }, { status: 400 });
    }

    const fromCurrency = accounts.find((a) => a.id === fromAccountId)?.currency ?? null;
    const toCurrency = accounts.find((a) => a.id === toAccountId)?.currency ?? null;

    // v1 transfers are same-currency. Guessing a rate would make the two
    // account deltas disagree, so reject instead.
    const transferCurrency = currency ?? fromCurrency ?? "USD";
    if (
      (fromCurrency && transferCurrency.toUpperCase() !== fromCurrency.toUpperCase()) ||
      (toCurrency && transferCurrency.toUpperCase() !== toCurrency.toUpperCase())
    ) {
      return NextResponse.json({ error: CROSS_CURRENCY_TRANSFER }, { status: 400 });
    }

    // Same frozen-snapshot shape as `transaction`; a same-currency transfer
    // sends no fx columns at all.
    const fxColumns = buildFxColumns({
      currency: transferCurrency,
      amount,
      fxRate,
      fxSource,
    });

    const { data, error: insertError } = await supabase
      .from("transfer")
      .insert({
        id: generateId(),
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
        currency: transferCurrency,
        date: date ?? new Date().toISOString().slice(0, 10),
        description: description ?? null,
        notes: notes ?? null,
        user_id: userId,
        ...fxColumns,
      })
      .select(TRANSFER_SELECT)
      .single();

    if (insertError) {
      if (isMissingFxColumnError(insertError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      if (isMissingAccountTableError(insertError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}