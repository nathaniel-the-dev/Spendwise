import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import {
  buildFxColumns,
  FX_MIGRATION_REQUIRED,
  isMissingFxColumnError,
} from "@/lib/fx";
import {
  ACCOUNT_MIGRATION_REQUIRED,
  isMissingAccountTableError,
  isMissingAccountsColumnError,
} from "@/lib/accounts";

const createSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
  description: z.string().min(1),
  date: z.string(),
  type: z.enum(["expense", "income"]).optional(),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

/** `account` embed so the ledger can label which account a row landed in. */
const TRANSACTION_SELECT = "*, category(*), account(*)";
/** Fallback used when the accounts migration hasn't been applied yet. */
const TRANSACTION_SELECT_NO_ACCOUNT = "*, category(*)";

export async function GET(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const categoryId = url.searchParams.get("categoryId");
    const type = url.searchParams.get("type");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const minAmount = url.searchParams.get("minAmount");
    const maxAmount = url.searchParams.get("maxAmount");
    const uncategorized = url.searchParams.get("uncategorized");
    const accountId = url.searchParams.get("accountId");
    const unassigned = url.searchParams.get("unassigned");
    const tag = url.searchParams.get("tag");
    const sort = url.searchParams.get("sort") ?? "date";
    const dir = url.searchParams.get("dir") ?? "desc";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50") || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0") || 0, 0);

    // The `account(*)` embed and `account_id` filters need the accounts migration. Until it is
    // applied the ledger must still load, so the query is rebuilt without them instead of 500-ing.
    const needsAccounts = Boolean(accountId) || unassigned === "true";

    const buildQuery = (select: string, withAccounts: boolean) => {
      let query = supabase
        .from("transaction")
        .select(select, { count: "exact" })
        .eq("user_id", userId);
      if (sort === "amount") {
        query = query.order("amount", { ascending: dir === "asc" });
      } else {
        query = query.order("date", { ascending: dir === "asc" });
      }
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (startDate) {
        query = query.gte("date", startDate);
      }

      if (endDate) {
        query = query.lte("date", endDate);
      }

      if (minAmount) {
        query = query.gte("amount", parseFloat(minAmount));
      }

      if (maxAmount) {
        query = query.lte("amount", parseFloat(maxAmount));
      }

      if (uncategorized === "true") {
        query = query.is("category_id", null);
      }

      if (withAccounts && accountId) {
        query = query.eq("account_id", accountId);
      }

      // Rows that predate accounts, or whose account was deleted, live here.
      if (withAccounts && unassigned === "true") {
        query = query.is("account_id", null);
      }

      if (tag) {
        query = query.contains("tags", [tag]);
      }

      return query;
    };

    let { data, error: queryError, count } = await buildQuery(TRANSACTION_SELECT, true);

    if (queryError && isMissingAccountsColumnError(queryError)) {
      if (needsAccounts) {
        // The caller filtered by account, so an unfiltered ledger would be the wrong answer.
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.warn("accounts migration not applied; serving transactions without account embed");
      ({ data, error: queryError, count } = await buildQuery(TRANSACTION_SELECT_NO_ACCOUNT, false));
    }

    if (queryError) {
      if (isMissingAccountTableError(queryError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase query error:", queryError);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }

    return NextResponse.json(data ?? [], {
      headers: { "X-Total-Count": String(count ?? 0) },
    });
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

    const { amount, currency, fxRate, fxSource, description, date, type, categoryId, accountId, tags, notes } = parsed.data;
    const id = generateId();

    // Foreign amounts carry a frozen preferred-currency snapshot; amounts already
    // in the preferred currency contribute no fx columns at all.
    const fxColumns = buildFxColumns({ currency, amount, fxRate, fxSource });

    // Ownership is checked before the write: a raw FK violation would surface as
    // an opaque 500 and the user couldn't tell which id was wrong.
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from("account")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", userId)
        .maybeSingle();

      if (accountError) {
        if (isMissingAccountTableError(accountError)) {
          return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
        }
        console.error("Supabase query error:", accountError);
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
      }

      if (!account) {
        return NextResponse.json({ error: "That account isn't yours." }, { status: 400 });
      }
    }

    const buildInsert = (select: string, withAccount: boolean) => {
      const row: Record<string, unknown> = {
        id,
        amount,
        currency: currency ?? "USD",
        description,
        date,
        type: type ?? "expense",
        category_id: categoryId ?? null,
        tags: tags ?? null,
        notes: notes ?? null,
        user_id: userId,
        ...fxColumns,
      };
      // Only send account_id when the column can exist; otherwise the payload itself is rejected.
      if (withAccount) row.account_id = accountId ?? null;
      return supabase.from("transaction").insert(row).select(select).single();
    };

    let { data, error: insertError } = await buildInsert(TRANSACTION_SELECT, true);

    if (insertError && isMissingAccountsColumnError(insertError) && !accountId) {
      // Same rule as the GET: a plain expense must keep saving while the migration is pending.
      console.warn("accounts migration not applied; creating transaction without account column");
      ({ data, error: insertError } = await buildInsert(TRANSACTION_SELECT_NO_ACCOUNT, false));
    }

    if (insertError) {
      if (isMissingFxColumnError(insertError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      if (isMissingAccountTableError(insertError) || isMissingAccountsColumnError(insertError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
