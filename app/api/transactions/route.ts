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

const createSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
  description: z.string().min(1),
  date: z.string(),
  type: z.enum(["expense", "income"]).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

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
    const tag = url.searchParams.get("tag");
    const sort = url.searchParams.get("sort") ?? "date";
    const dir = url.searchParams.get("dir") ?? "desc";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50") || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0") || 0, 0);

    let query = supabase
      .from("transaction")
      .select("*, category(*)", { count: "exact" })
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

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data, error: queryError, count } = await query;

    if (queryError) {
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

    const { amount, currency, fxRate, fxSource, description, date, type, categoryId, tags, notes } = parsed.data;
    const id = generateId();

    // Foreign amounts carry a frozen preferred-currency snapshot; amounts already
    // in the preferred currency contribute no fx columns at all.
    const fxColumns = buildFxColumns({ currency, amount, fxRate, fxSource });

    const { data, error: insertError } = await supabase
      .from("transaction")
      .insert({
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
      })
      .select("*, category(*)")
      .single();

    if (insertError) {
      if (isMissingFxColumnError(insertError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
