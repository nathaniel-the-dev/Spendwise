import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  amountInPreferred: z.number().optional(),
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
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    let query = supabase
      .from("transaction")
      .select("*, category(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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

    const { data, error: queryError } = await query;

    if (queryError) {
      console.error("Supabase query error:", queryError);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
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

    const { amount, currency, amountInPreferred, description, date, type, categoryId, tags, notes } = parsed.data;
    const id = generateId();

    const { data, error: insertError } = await supabase
      .from("transaction")
      .insert({
        id,
        amount,
        currency: currency ?? "USD",
        amount_in_preferred: amountInPreferred ?? null,
        description,
        date,
        type: type ?? "expense",
        category_id: categoryId ?? null,
        tags: tags ?? null,
        notes: notes ?? null,
        user_id: userId,
      })
      .select("*, category(*)")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
