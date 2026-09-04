import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  period: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();

    const { data, error: insertError } = await supabase
      .from("budget")
      .select("*, category(*)")
      .eq("user_id", userId);

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

    const { categoryId, amount, currency, period, startDate, endDate } = parsed.data;
    const id = generateId();

    const { data, error: insertError } = await supabase
      .from("budget")
      .insert({
        id,
        category_id: categoryId ?? null,
        amount,
        currency: currency ?? "USD",
        period,
        start_date: startDate,
        end_date: endDate ?? null,
        user_id: userId,
      })
      .select("*, category(*)")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
